obs = obslua
player_name = "firefox"  -- 기본값

------------------------------------------------------
-- OBS에서 보여질 스크립트 설명
------------------------------------------------------
function script_description()
    return "녹화 시작 시 지정된 MPRIS 플레이어 (예: Firefox)의 재생을 자동으로 시작합니다. 또한 미디어 길이를 OBS Script Log에 표시합니다."
end

------------------------------------------------------
-- OBS 속성 설정
------------------------------------------------------
function script_properties()
    local props = obs.obs_properties_create()
    obs.obs_properties_add_text(props, "player_name", "Player Name (default: firefox)", obs.OBS_TEXT_DEFAULT)
    obs.obs_properties_add_text(props, "status_text", "스크립트 출력은 Script Log에서 볼 수 있습니다.", obs.OBS_TEXT_INFO)

    return props
end

------------------------------------------------------
-- 속성 값이 변경되었을 때 호출됨
------------------------------------------------------
function script_update(settings)
    player_name = obs.obs_data_get_string(settings, "player_name")
    player_name = (player_name ~= nil and player_name ~= "") and player_name or "firefox"
end

------------------------------------------------------
-- 녹화 시작 시 호출될 콜백 함수
------------------------------------------------------
function on_recording_started()
    local cmd = "playerctl --player=" .. player_name .. " play &"
    os.execute(cmd)

    local status_cmd = string.format("playerctl --player=$(playerctl -l | grep %s) status", player_name)
    local status_handle = io.popen(status_cmd)
    local status = status_handle:read("*a"):gsub("\n", ""):lower()
    status_handle:close()

    if not status == "playing" then
        print("error: unable to play media. " .. player_name .. " doesn't accept any media or has unsupported media keys.")
        if obs.obs_frontend_recording_active() then
            print("OBS recording was stopped due to " .. player_name .. " not playing any media.")
            obs.obs_frontend_recording_stop()
        end

        return
    end

    local metadata_cmd = string.format("playerctl --player=$(playerctl -l | grep %s) metadata --format '[{{duration(position)}} / {{duration(mpris:length)}}] {{xesam:title}}'", player_name)
    local metadata_handle = io.popen(metadata_cmd)
    local metadata = metadata_handle:read("*a")
    metadata_handle:close()

    result = string.format("▶ %s: %s", player_name, metadata:gsub("\n", ""))

    obs.script_log(obs.LOG_INFO, result)
end

------------------------------------------------------
-- 스크립트 로드 시 호출
------------------------------------------------------
function script_load(settings)
    obs.obs_frontend_add_event_callback(function(event)
        if event == obs.OBS_FRONTEND_EVENT_RECORDING_STARTED then
            on_recording_started()
        end
    end)
end

