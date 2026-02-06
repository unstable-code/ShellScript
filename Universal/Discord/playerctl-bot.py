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
@tree.command(name="status", description="현재 재생 중인 음악 정보를 출력합니다.")
async def status(interaction: discord.Interaction):
    if interaction.user.id != owner_id:
        await interaction.response.send_message("⛔ 권한이 없습니다. 등록된 사용자만 실행 가능합니다.", ephemeral=True)
        return
    try:
        # playerctl metadata 실행
        result = subprocess.check_output(
            ["playerctl", "metadata", "--format", "제목: {{trunc(title, 27)}}\nURL: {{trunc(xesam:url, 27)}}\n{{duration(position)}} | {{duration(mpris:length)}}"],
            text=True
        )
        if not result:
            result = "⚠️ playerctl 실행에 실패했습니다."
        await interaction.response.send_message(f"### 🎵 현재 재생 정보:\n```\n{result}\n```", ephemeral=True)
    except subprocess.CalledProcessError:
        await interaction.response.send_message("🎵 현재 재생 중인 트랙이 없습니다.", ephemeral=True)
    except FileNotFoundError:
        await interaction.response.send_message("❌ 시스템에 playerctl이 설치되어 있지 않습니다.", ephemeral=True)
        sys.exit(1)


# 봇 실행
token = os.environ.get("DISCORD_BOT_PLAYERCTL")
owner_id = os.environ.get("DISCORD_BOT_PLAYERCTL_OWNER_ID")
if token and owner_id:
    owner_id = int(owner_id)
    client.run(token)
else:
    print("❌ 환경변수 'DISCORD_BOT_PLAYERCTL' 또는 'DISCORD_BOT_PLAYERCTL_OWNER_ID'가 설정되지 않았습니다. 비공개 토큰을 설정해 주세요.")
    sys.exit(1)

