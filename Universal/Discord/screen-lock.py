import os, sys, subprocess

import discord
from discord import app_commands

class aclient(discord.Client):
    def __init__(self):
        super().__init__(intents = discord.Intents.default())
        self.synced = False
    async def on_ready(self):
        await self.wait_until_ready()
        if not self.synced:
            await tree.sync()
            self.synced = True

client = aclient()
tree = app_commands.CommandTree(client)


# 슬래시 옵션 리스트
@tree.command(name="lock", description="화면 잠금을 실행합니다.")
async def status(interaction: discord.Interaction):
    if interaction.user.id != owner_id:
        await interaction.response.send_message("⛔ 권한이 없습니다. 등록된 사용자만 실행 가능합니다.", ephemeral=True)
        return
    try:
        if subprocess.run(["pgrep", "-x", "swaylock"], stderr=subprocess.DEVNULL).returncode == 0:
            await interaction.response.send_message("⚠️ swaylock 실행에 실패했습니다. 이미 swaylock 이 실행 중입니다.", ephemeral=True)
        else:
            subprocess.Popen([f"{os.environ.get('HOME')}/.config/sway/src/backend", "lock_session"], start_new_session=True)
            await interaction.response.send_message("🔒 화면이 잠겼습니다 (swaylock 실행됨).", ephemeral=True)
    except FileNotFoundError:
        await interaction.response.send_message("❌ 시스템에 sway 또는 backend 가 설치되어 있지 않습니다.", ephemeral=True)
        sys.exit(1)
    except Exception as e:
        await interaction.response.send_message(f"⚠️ swaylock 실행에 실패했습니다. 내부 오류가 발생했습니다.\n{e}", ephemeral=True)
        sys.exit(1)


# 봇 실행
if subprocess.run(["pgrep", "-x", "sway"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode != 0:
    print("❌ 현재 윈도우 컴포지터는 sway 가 아닌 것으로 식별되었습니다. 이 봇을 종료합니다.")
    sys.exit(1)

token = os.environ.get("DISCORD_BOT_SWAY")
owner_id = os.environ.get("DISCORD_BOT_SWAY_OWNER_ID")
if token and owner_id:
    owner_id = int(owner_id)
    client.run(token)
else:
    print("❌ 환경변수 'DISCORD_BOT_SWAY' 또는 'DISCORD_BOT_SWAY_OWNER_ID'가 설정되지 않았습니다. 비공개 토큰을 설정해 주세요.")
    sys.exit(1)

