from asyncio import create_task, sleep as asleep
from urllib.parse import urlparse
from Backend.logger import LOGGER
from Backend import db
from Backend.config import Telegram
from Backend.helper.custom_filter import CustomFilters
from Backend.helper.encrypt import decode_string
from Backend.helper.metadata import metadata
from Backend.helper.pyro import clean_filename, get_readable_file_size, remove_urls
from Backend.pyrofork import StreamBot
from pyrogram import filters, Client
from pyrogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from os import path as ospath
from pyrogram.errors import FloodWait, UserNotParticipant
from pyrogram.enums.parse_mode import ParseMode
from themoviedb import aioTMDb
from asyncio import Queue, create_task
from os import execl as osexecl
from asyncio import create_subprocess_exec, gather
from sys import executable
from aiofiles import open as aiopen
from pyrogram import enums

force_subs = ["pboxtv"]

try:
    tmdb = aioTMDb(api_key=Telegram.TMDB_API, language="en-US", region="US")
except TypeError:
    try:
        tmdb = aioTMDb(key=Telegram.TMDB_API, language="en-US", region="US")
    except TypeError:
        tmdb = aioTMDb()
        if hasattr(tmdb, "api_key"):
            tmdb.api_key = Telegram.TMDB_API
        elif hasattr(tmdb, "key"):
            tmdb.key = Telegram.TMDB_API
# Initialize database connection
import random
import string
from passlib.context import CryptContext
from datetime import datetime, timedelta

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_password(length=10):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

@StreamBot.on_message(filters.command("user") & filters.private & CustomFilters.owner)
async def create_user(bot: Client, message: Message):
    try:
        args = message.text.split()
        if len(args) != 3:
            await message.reply_text("❌ Usage: `/user <username> <expiry_days>`", parse_mode=ParseMode.MARKDOWN)
            return

        username = args[1]
        expiry_days = int(args[2])

        users_collection = db.db["auth_users"]  # Use the Tracking database

        # Check if username already exists
        existing_user = await users_collection.find_one({"username": username})
        if existing_user:
            await message.reply_text(f"❌ User `{username}` already exists!", parse_mode=ParseMode.MARKDOWN)
            return

        password = generate_password()
        hashed_password = pwd_ctx.hash(password)
        expires_at = datetime.utcnow() + timedelta(days=expiry_days)

        user_data = {
            "username": username,
            "password": hashed_password,
            "expires_at": expires_at
        }
        await users_collection.insert_one(user_data)

        await message.reply_text(
            f"✅ User created!\n\n"
            f"👤 Username: `{username}`\n"
            f"🔑 Password: `{password}`\n"
            f"🕒 Expires in: `{expiry_days}` days\n"
            f"📅 Expiry Date: `{expires_at.strftime('%Y-%m-%d %H:%M:%S')} UTC`",
            parse_mode=ParseMode.MARKDOWN
        )

    except Exception as e:
        LOGGER.error(f"Error in /user command: {e}")
        await message.reply_text("❌ An error occurred while creating the user.")

@StreamBot.on_message(filters.command('restart') & filters.private & CustomFilters.owner)
async def restart(bot: Client, message: Message):
    try:
        # Notify the user that the bot is restarting
        
        restart_message = await message.reply_text(
    '<blockquote>⚙️ Restarting Backend API... \n\n✨ Please wait as we bring everything back online! 🚀</blockquote>',
        quote=True,
        parse_mode=enums.ParseMode.HTML
        )
        LOGGER.info("Restart initiated by owner.")

        # Run the update script
        proc1 = await create_subprocess_exec('python3', 'update.py')
        await gather(proc1.wait())

        # Save restart message details for notification after restart
        async with aiopen(".restartmsg", "w") as f:
            await f.write(f"{restart_message.chat.id}\n{restart_message.id}\n")

        # Restart the bot process
        osexecl(executable, executable, "-m", "Backend")

    except Exception as e:
        LOGGER.error(f"Error during restart: {e}")
        await message.reply_text("**❌ Failed to restart. Check logs for details.**")




async def delete_messages_after_delay(messages):
    await asleep(300)  
    for msg in messages:
        try:
            await msg.delete()
        except Exception as e:
            LOGGER.error(f"Error deleting message {msg.id}: {e}")
        await asleep(2)

@StreamBot.on_message(filters.command("setchannel") & filters.private & CustomFilters.owner)
async def set_forced_channel(bot: Client, message: Message):
    if len(message.command) < 2:
        return await message.reply("Usage: /setchannel <channel1> <channel2> ...")
    
    channels = [ch.lstrip("@") for ch in message.command[1:]]
    for ch in channels:
        await db.set_channel(message.from_user.id, ch)

    await message.reply(f"✅ Added channels: {', '.join(['@' + ch for ch in channels])}")

@StreamBot.on_message(filters.command("getchannel") & filters.private & CustomFilters.owner)
async def get_forced_channel(bot: Client, message: Message):
    channels = await db.get_channel(message.from_user.id)
    if channels:
        joined = '\n'.join([f"📢 @{ch}" for ch in channels])
        await message.reply(f"Your channels:\n{joined}")
    else:
        await message.reply("⚠️ No channels set.")
        
@StreamBot.on_message(filters.command("removechannel") & filters.private & CustomFilters.owner)
async def remove_forced_channel(bot: Client, message: Message):
    if len(message.command) < 2:
        return await message.reply("Usage: /removechannel <channel_username>")
    
    ch = message.command[1].lstrip("@")
    await db.remove_channel(message.from_user.id, ch)
    await message.reply(f"❌ Removed: @{ch}")
    
@StreamBot.on_message(filters.command("clearchannels") & filters.private & CustomFilters.owner)
async def clear_channels(bot: Client, message: Message):
    await db.clear_channels(message.from_user.id)
    await message.reply("✅ All forced join channels removed.")


@StreamBot.on_message(filters.command('start') & filters.private)
async def start(bot: Client, message: Message):
    user_id = message.from_user.id
    user_channel = await db.get_channel(message.from_user.id)
    channels_to_check = user_channel if isinstance(user_channel, list) and user_channel else force_subs
    not_joined = []
    for channel in channels_to_check:
        try:
            user = await bot.get_chat_member(channel, user_id)
            if user.status == enums.ChatMemberStatus.BANNED:
                return await message.reply("🚫 You are banned from using this bot.")
        except UserNotParticipant:
            not_joined.append(channel)
        except Exception as e:
            LOGGER.error(f"Error checking channel {channel}: {e}")
            return await message.reply("❌ Couldn't verify your membership. Try again later.")
            
    if not_joined:
        buttons = [
            [InlineKeyboardButton("📢 Join Channel", url=f"https://t.me/{ch}")]
            for ch in not_joined
        ]
        cmd = message.text
        buttons.append([InlineKeyboardButton("↻ 𝖳𝗋𝗒 𝖠𝗀𝖺𝗂𝗇", callback_data=f"retry:{cmd}")])
        
        return await message.reply_text(
            "**🚫 You must join all required channels to use this bot.**",
            reply_markup=InlineKeyboardMarkup(buttons)
        )
    
    LOGGER.info(f"Received command: {message.text}")
    
    command_part = message.text.split('start ')[-1]
    
    if command_part.startswith("file_"):
        usr_cmd = command_part[len("file_"):].strip()
        
        parts = usr_cmd.split("_")
        
        if len(parts) == 2:
            try:
                tmdb_id, quality = parts
                tmdb_id = int(tmdb_id)
                season = None
                quality_details = await db.get_quality_details(tmdb_id, quality)
            except ValueError:
                LOGGER.error(f"Error parsing movie command: {usr_cmd}")
                await message.reply_text("Invalid command format for movie.")
                return
        
        elif len(parts) == 3:
            try:
                tmdb_id, season, quality = parts
                tmdb_id = int(tmdb_id)
                season = int(season)
                quality_details = await db.get_quality_details(tmdb_id, quality, season)
            except ValueError:
                LOGGER.error(f"Error parsing TV show command: {usr_cmd}")
                await message.reply_text("Invalid command format for TV show.")
                return
        elif len(parts) == 4:
            try:
                tmdb_id, season, episode, quality = parts
                tmdb_id = int(tmdb_id)
                season = int(season)
                episode = int(episode)
                quality_details = await db.get_quality_details(tmdb_id, quality, season, episode)
            except ValueError:
                LOGGER.error(f"Error parsing TV show command: {usr_cmd}")
                await message.reply_text("Invalid command format for TV show.")
                return

        else:
            await message.reply_text("Invalid command format.")
            return

        sent_messages = []
        for detail in quality_details:
            decoded_data = await decode_string(detail['id'])
            channel = f"-100{decoded_data['chat_id']}"
            msg_id = decoded_data['msg_id']
            name = detail['name']
            if "\\n" in name and name.endswith(".mkv"):
                name = name.rsplit(".mkv", 1)[0].replace("\\n", "\n")
            try:
                file = await bot.get_messages(int(channel), int(msg_id))
                media = file.document or file.video
                if media:
                    sent_msg = await message.reply_cached_media(
                        file_id=media.file_id,
                        caption=f'{name}'
                    )
                    sent_messages.append(sent_msg)
                    await asleep(1)
            except FloodWait as e:
                LOGGER.info(f"Sleeping for {e.value}s")
                await asleep(e.value)
                await message.reply_text(f"Got Floodwait of {e.value}s")
            except Exception as e:
                LOGGER.error(f"Error retrieving/sending media: {e}")
                await message.reply_text("Error retrieving media.")

        if sent_messages:
            warning_msg = await message.reply_text(
                "Forward these files to your saved messages. These files will be deleted from the bot within 5 minutes."
            )
            sent_messages.append(warning_msg)
            create_task(delete_messages_after_delay(sent_messages))
    else:
        await message.reply_text("**Welcome to @Pboxtvstorebot!** 🎬\n\n"
            "I am here to provide direct download links for movies & series from pboxtv.com.\n"
            "📥 Just send a file link to get started!"
        )

@StreamBot.on_callback_query(filters.regex(r"^retry:(.+)"))
async def retry_start(bot: Client, query: CallbackQuery):
    user_id = query.from_user.id
    cmd_text = query.matches[0].group(1)
    not_joined = []
    
    user_channel = await db.get_channel(query.from_user.id)
    channels_to_check = user_channel if user_channel else force_subs
    for channel in channels_to_check:
        try:
            user = await bot.get_chat_member(channel, user_id)
            if user.status == enums.ChatMemberStatus.BANNED:
                await query.answer("🚫 You're banned from using this bot.", show_alert=True)
                return
        except UserNotParticipant:
            not_joined.append(channel)
        except Exception as e:
            LOGGER.error(f"Retry Join Check Error: {e}")
            await query.answer("⚠️ Retry failed, please try again later.", show_alert=True)
            return
    if not_joined:
        await query.answer("🚫 Please join required channels first!", show_alert=True)
        return
    cmd_text_clean = cmd_text.strip()
    if cmd_text_clean.startswith('/start'):
        parts = cmd_text_clean.split(' ', 1)
        if len(parts) == 2:
            param = parts[1]
        else:
            param = "start"
    else:
        param = cmd_text_clean  # fallback

    deep_link = f"https://t.me/{bot.username}?start={param}"

    await query.message.edit_text(
        f"✅ You’ve successfully joined required channels.\n\n👉 Tap the button below to continue:",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton(" continue ", url=deep_link)]
        ])
    )
    await query.answer()


@StreamBot.on_message(filters.command('log') & filters.private & CustomFilters.owner)
async def start(bot: Client, message: Message):
    try:
        path = ospath.abspath('log.txt')
        return await message.reply_document(
        document=path, quote=True, disable_notification=True
        )
    except Exception as e:
        print(f"An error occurred: {e}")




# Global queue for processing file updates
file_queue = Queue()

from asyncio import Lock

# Global lock for database access
db_lock = Lock()

async def process_file():
    while True:
        metadata_info, hash, channel, msg_id, size, title = await file_queue.get()

        # Acquire the lock before updating the database
        async with db_lock:
            updated_id = await db.insert_media(metadata_info, hash=hash, channel=channel, msg_id=msg_id, size=size, name=title)

            if updated_id:
                LOGGER.info(f"{metadata_info['media_type']} updated with ID: {updated_id}")
            else:
                LOGGER.info("Update failed due to validation errors.")

        file_queue.task_done()



# Start the file processing tasks (adjust the number of workers as needed)
for _ in range(1):  # Two concurrent workers
    create_task(process_file())

@StreamBot.on_message(
    filters.channel
    & (
        filters.document
        | filters.video
    )
)
async def file_receive_handler(bot: Client, message: Message):
    if str(message.chat.id) in Telegram.AUTH_CHANNEL:
        try:
            if message.video or message.document:
                file = message.video or message.document
                if Telegram.USE_CAPTION:
                    title = message.caption.replace("\n", "\\n")
                else:
                    title = file.file_name or file.file_id
                msg_id = message.id
                hash = file.file_unique_id[:6]
                size = get_readable_file_size(file.file_size)
                channel = str(message.chat.id).replace("-100","")
                

                metadata_info = await metadata(clean_filename(title), file)
                if metadata_info is None:
                    return


                # Add file data to the queue for processing
                title = remove_urls(title)
                if not title.endswith('.mkv'):
                    title += '.mkv'
                await file_queue.put((metadata_info, hash, int(channel), msg_id, size, title))

            else:
                await message.reply_text("Not supported")
        except FloodWait as e:
            LOGGER.info(f"Sleeping for {str(e.value)}s")
            await asleep(e.value)
            await message.reply_text(text=f"Got Floodwait of {str(e.value)}s",
                                disable_web_page_preview=True, parse_mode=ParseMode.MARKDOWN)
    else:
        await message.reply(text="Channel is not in AUTH_CHANNEL")


@Client.on_message(filters.command('caption') & filters.private & CustomFilters.owner)
async def toggle_caption(bot: Client, message: Message):
    try:
        Telegram.USE_CAPTION = not Telegram.USE_CAPTION
        await message.reply_text(f"Now Bot Uses {'Caption' if Telegram.USE_CAPTION else 'Filename'}")
    except Exception as e:
        print(f"An error occurred: {e}")

@Client.on_message(filters.command('tmdb') & filters.private & CustomFilters.owner)
async def toggle_tmdb(bot: Client, message: Message):
    try:
        Telegram.USE_TMDB = not Telegram.USE_TMDB
        await message.reply_text(f"Now Bot Uses {'TMDB' if Telegram.USE_TMDB else 'IMDB'}")
    except Exception as e:
        print(f"An error occurred: {e}")

@Client.on_message(filters.command('set') & filters.private & CustomFilters.owner)
async def set_id(bot: Client, message: Message):

    url_part = message.text.split()[1:]  # Skip the command itself

    try:
        if len(url_part) == 1:

            Telegram.USE_DEFAULT_ID = url_part[0]  # Get the first element
            await message.reply_text(f"Now Bot Uses Default URL: {Telegram.USE_DEFAULT_ID}")
        else:
            # Remove the default ID
            Telegram.USE_DEFAULT_ID = None
            await message.reply_text("Removed default ID.")
    except Exception as e:
        await message.reply_text(f"An error occurred: {e}")





@Client.on_message(filters.command('delete') & filters.private & CustomFilters.owner)
async def delete(bot: Client, message: Message):
    try:
        split_text = message.text.split()
        if len(split_text) != 2:
            return await message.reply_text("Use this format: /delete https://domain/ser/3123")
        
        url = split_text[1]
        parsed_url = urlparse(url)
        path_parts = parsed_url.path.split('/')
        
        if len(path_parts) >= 3 and path_parts[-2] in ('ser', 'mov') and path_parts[-1].isdigit():
            media_type = path_parts[-2]
            tmdb_id = path_parts[-1]
            delete = await db.delete_document(media_type, int(tmdb_id))
            if delete:
                return await message.reply_text(f"{media_type} with ID {tmdb_id} has been deleted successfully.")
            else:
                return await message.reply_text(f"ID {tmdb_id} wasn't found in the database.")
        else:
            return await message.reply_text("The URL format is incorrect.")
    
    except Exception as e:
        await message.reply_text(f"An error occurred: {str(e)}")
        

@StreamBot.on_message(filters.command('set_ads') & filters.private & CustomFilters.owner)
async def set_ads_handler(bot, message):
    args = message.text.split(maxsplit=2)
    if len(args) < 3:
        return await message.reply("❌ Usage:\n<code>/set_ads &lt;poster_url&gt; &lt;target_url&gt;</code>", quote=True)

    poster, url = args[1], args[2]
    await db.add_ad(poster, url)
    await message.reply("✅ Ad added successfully!")

@StreamBot.on_message(filters.command('get_ads') & filters.private & CustomFilters.owner)
async def get_ads_handler(bot, message):
    ads = await db.get_ads()
    if not ads:
        return await message.reply("⚠️ No ads found.")

    msg = "📢 <b>Current Ads:</b>\n\n"
    for idx, ad in enumerate(ads):
        msg += f"<b>{idx + 1}.</b> <a href='{ad['url']}'>Ad Link</a>\nPoster: {ad['poster']}\n\n"

    await message.reply(msg, disable_web_page_preview=True)


@StreamBot.on_message(filters.command('remove_ad') & filters.private & CustomFilters.owner)
async def remove_ad_handler(bot, message):
    args = message.text.split()
    if len(args) < 2 or not args[1].isdigit():
        return await message.reply("❌ Usage:\n<code>/remove_ad &lt;ad_index&gt;</code>")

    index = int(args[1]) - 1
    success = await db.remove_ad_by_index(index)
    if success:
        await message.reply(f"✅ Ad #{index + 1} removed.")
    else:
        await message.reply("❌ Invalid index or ad not found.")

@StreamBot.on_message(filters.command('clear_ads') & filters.private & CustomFilters.owner)
async def clear_ads_handler(bot, message):
    await db.clear_ads()
    await message.reply("🗑️ All ads have been removed.")