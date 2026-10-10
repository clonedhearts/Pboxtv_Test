from asyncio import get_event_loop, sleep as asleep
from traceback import format_exc
from pyrogram import idle
from Backend import __version__, db
from Backend.logger import LOGGER
from Backend.pyrofork import StreamBot
from Backend.pyrofork.clients import initialize_clients
from Backend.helper.pyro import restart_notification
from Backend.fastapi.sidecar import sidecar

import uvicorn
from pyrogram import utils as pyroutils
pyroutils.MIN_CHAT_ID = -999999999999
pyroutils.MIN_CHANNEL_ID = -100999999999999

loop = get_event_loop()

async def start_services():
    try:
        LOGGER.info(f"Initializing PboxTV Telegram Sidecar v-{__version__}")
        await asleep(1.2)

        await db.connect()
        await asleep(1.2)

        await StreamBot.start()
        StreamBot.username = StreamBot.me.username
        LOGGER.info(f"Bot Client : [@{StreamBot.username}]")

        await asleep(1.2)
        LOGGER.info("Initializing Multi Clients...")
        await initialize_clients()

        LOGGER.info(f"Starting internal sidecar HTTP server on :{Telegram.PORT}...")
        await restart_notification()

        # Start sidecar on configured PORT
        config = uvicorn.Config(
            sidecar,
            host="0.0.0.0",
            port=Telegram.PORT,
            log_level="warning",
            loop="asyncio",
        )
        server = uvicorn.Server(config)
        loop.create_task(server.serve())

        LOGGER.info("PboxTV Sidecar Started Successfully!")
        await idle()
    except Exception:
        LOGGER.error("Error during startup:\n" + format_exc())
        raise


async def stop_services():
    try:
        LOGGER.info("Stopping services...")
        await StreamBot.stop()
        await db.disconnect()
        LOGGER.info("Services stopped successfully.")
    except Exception:
        LOGGER.error("Error during shutdown:\n" + format_exc())


if __name__ == '__main__':
    try:
        loop.run_until_complete(start_services())
    except KeyboardInterrupt:
        LOGGER.info('Service Stopping...')
    except Exception:
        LOGGER.error(format_exc())
    finally:
        loop.run_until_complete(stop_services())
        loop.stop()
