"""
Internal HTTP sidecar endpoints exposed ONLY on localhost for the Go API server.
These are NOT reachable from the internet.

Routes:
  GET /internal/status         — bot count, uptime
  GET /internal/is_member      — Telegram channel membership check
  GET /internal/dl/:id/:name   — stream file chunks from Telegram
"""

from time import time
import math
import mimetypes
import secrets
from typing import Optional

from fastapi import FastAPI, Query, Request, HTTPException
from fastapi.responses import StreamingResponse
from pyrogram.enums import ChatMemberStatus
from pyrogram.file_id import FileType

from Backend.logger import LOGGER
from Backend.config import Telegram
from Backend.pyrofork import StreamBot, work_loads, multi_clients
from Backend.helper.exceptions import InvalidHash
from Backend.helper.custom_dl import ByteStreamer
from Backend.helper.pyro import get_readable_time
from Backend.helper.encrypt import decode_string
from Backend import StartTime, __version__

sidecar = FastAPI(title="PboxTV Internal Sidecar", docs_url=None, redoc_url=None)
class_cache = {}

# ─────────────────────────── Status ───────────────────────────────────────

@sidecar.get("/internal/status")
async def internal_status():
    return {
        "server_status": "running",
        "uptime": get_readable_time(time() - StartTime),
        "telegram_bot": "@" + StreamBot.username,
        "connected_bots": len(multi_clients),
        "loads": {
            "bot" + str(c + 1): l
            for c, (_, l) in enumerate(
                sorted(work_loads.items(), key=lambda x: x[1], reverse=True)
            )
        },
        "version": __version__,
    }

# ─────────────────────────── Membership ───────────────────────────────────

@sidecar.get("/internal/is_member")
async def is_member(user_id: int, channel: int):
    try:
        member = await StreamBot.get_chat_member(channel, user_id)
        if member.status in (
            ChatMemberStatus.MEMBER,
            ChatMemberStatus.ADMINISTRATOR,
            ChatMemberStatus.OWNER,
        ):
            return {"is_member": True}
        return {"is_member": False}
    except Exception:
        return {"is_member": False}

# ─────────────────────────── Streaming ────────────────────────────────────

@sidecar.get("/internal/dl/{id}/{name}")
async def stream_handler(request: Request, id: str, name: str):
    decoded_data = await decode_string(id)
    if not decoded_data.get("msg_id") or not decoded_data.get("hash"):
        raise HTTPException(status_code=400, detail="Missing id or hash")

    chat_id = f"-100{decoded_data['chat_id']}"
    return await media_streamer(
        request, int(chat_id), int(decoded_data["msg_id"]), decoded_data["hash"]
    )


async def media_streamer(request: Request, chat_id: int, id: int, secure_hash: str):
    range_header = request.headers.get("Range", 0)
    index = min(work_loads, key=work_loads.get)
    faster_client = multi_clients[index]

    if faster_client in class_cache:
        tg_connect = class_cache[faster_client]
    else:
        tg_connect = ByteStreamer(faster_client)
        class_cache[faster_client] = tg_connect

    file_id = await tg_connect.get_file_properties(chat_id=chat_id, message_id=id)

    if file_id.unique_id[:6] != secure_hash:
        raise InvalidHash

    file_size = file_id.file_size
    if range_header:
        from_bytes, until_bytes = range_header.replace("bytes=", "").split("-")
        from_bytes = int(from_bytes)
        until_bytes = int(until_bytes) if until_bytes else file_size - 1
    else:
        from_bytes = 0
        until_bytes = file_size - 1

    if (until_bytes > file_size) or (from_bytes < 0) or (until_bytes < from_bytes):
        return StreamingResponse(
            content=("416: Range not satisfiable",),
            status_code=416,
            headers={"Content-Range": f"bytes */{file_size}"},
        )

    chunk_size = 1024 * 1024
    until_bytes = min(until_bytes, file_size - 1)
    offset = from_bytes - (from_bytes % chunk_size)
    first_part_cut = from_bytes - offset
    last_part_cut = until_bytes % chunk_size + 1
    req_length = until_bytes - from_bytes + 1
    part_count = math.ceil(until_bytes / chunk_size) - math.floor(offset / chunk_size)

    async def file_chunk_generator():
        async for chunk in tg_connect.yield_file(
            file_id, index, offset, first_part_cut, last_part_cut, part_count, chunk_size
        ):
            yield chunk

    mime_type = file_id.mime_type
    file_name = file_id.file_name
    disposition = "attachment" if file_id.file_type != FileType.VIDEO else "inline"

    if mime_type:
        if not file_name:
            try:
                file_name = f"{secrets.token_hex(2)}.{mime_type.split('/')[1]}"
            except (IndexError, AttributeError):
                file_name = f"{secrets.token_hex(2)}.unknown"
    else:
        if file_name:
            mime_type = mimetypes.guess_type(file_name)[0] or "application/octet-stream"
        else:
            mime_type = "application/octet-stream"
            file_name = f"{secrets.token_hex(2)}.unknown"

    return StreamingResponse(
        content=file_chunk_generator(),
        status_code=206 if range_header else 200,
        headers={
            "Content-Type": mime_type,
            "Content-Range": f"bytes {from_bytes}-{until_bytes}/{file_size}",
            "Content-Length": str(req_length),
            "Content-Disposition": f'{disposition}; filename="{file_name}"',
            "Accept-Ranges": "bytes",
        },
    )
