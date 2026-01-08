obs = obslua
player_name = "firefox"  -- 기본값

local fired = false

-- 설명
function script_description()
    return "지정한 MPRIS 플레이어 (예: Firefox) 가 재생 중이지 않으면 자동으로 녹화를 중단합니다."
end

-- 사용자 설정 항목 추가
function script_properties()
    local props = obs.obs_properties_create()
    obs.obs_properties_add_text(props, "player_name", "Player Name (default: firefox)", obs.OBS_TEXT_DEFAULT)

    return props
end

-- 설정 변경시 변수 반영
function script_update(settings)
    player_name = obs.obs_data_get_string(settings, "player_name")
    player_name = (player_name ~= nil and player_name ~= "") and player_name or "firefox"
end

-- 재생 상태 확인
function is_player_playing()
    if player_name == "" then return false end

    local cmd = "playerctl --player=" .. player_name .. " status 2>/dev/null"
    local handle = io.popen(cmd)
    if handle == nil then return false end

    local result = handle:read("*a")
    handle:close()

    return result:match("Playing") ~= nil
end

function change_interval(stat)
    if stat then
        fired = true
        obs.timer_remove(check_and_stop_recording)
        obs.timer_add(check_and_stop_recording, 1000)
        print("successfully changed obs.timer interval: 3000 -> 1000 ms due to ")
    else
        fired = false
        obs.timer_remove(check_and_stop_recording)
        obs.timer_add(check_and_stop_recording, 3000)
        print("successfully changed obs.timer interval: 1000 -> 3000 ms due to ")
    end
end

-- 타이머로 체크해서 녹화 중지
function check_and_stop_recording()
    if not is_player_playing() then
        if obs.obs_frontend_recording_active() and fired then
            print("OBS recording was stopped due to " .. player_name .. " does not playing any media.")
            obs.obs_frontend_recording_stop()
            change_interval(false)
        else
            if fired then change_interval(false) end
        end
    else
        if obs.obs_frontend_recording_active() and not fired then
            change_interval(true)
        end
    end
end

-- 스크립트 로드시 타이머 시작
function script_load(settings)
    obs.timer_add(check_and_stop_recording, 3000)
end

-- 스크립트 언로드시 타이머 제거
function script_unload()
    obs.timer_remove(check_and_stop_recording)
end

