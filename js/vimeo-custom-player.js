/**
 * Custom Vimeo Player
 * Vimeo Player SDK를 사용한 커스텀 비디오 플레이어
 * 
 * 사용법:
 * 1. <script src="https://player.vimeo.com/api/player.js"></script> 추가
 * 2. <script src="js/vimeo-custom-player.js"></script> 추가
 * 3. createCustomVimeoPlayer('container-id', 'vimeo-video-id')
 */

class CustomVimeoPlayer {
    constructor(containerId, videoId, options = {}) {
        this.container = document.getElementById(containerId);
        this.videoId = videoId;
        this.options = options;
        this.player = null;
        this.isPlaying = false;
        this.isHovered = false;
        this.volume = 1;
        this.isMuted = false;
        this.currentTime = 0;
        this.duration = 0;
        this.isReady = false;

        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Container not found');
            return;
        }

        // 컨테이너 스타일 설정
        this.container.className = 'custom-vimeo-player relative w-full bg-black rounded-lg overflow-hidden';
        this.container.innerHTML = this.getTemplate();

        // 요소 참조
        this.videoWrapper = this.container.querySelector('.video-wrapper');
        this.playerContainer = this.container.querySelector('.vimeo-embed');
        this.playButton = this.container.querySelector('.play-button');
        this.pauseButton = this.container.querySelector('.pause-button');
        this.controlsBar = this.container.querySelector('.controls-bar');
        this.progressBar = this.container.querySelector('.progress-bar');
        this.progressFill = this.container.querySelector('.progress-fill');
        this.timeDisplay = this.container.querySelector('.time-display');
        this.volumeButton = this.container.querySelector('.volume-button');
        this.volumeSlider = this.container.querySelector('.volume-slider');
        this.fullscreenButton = this.container.querySelector('.fullscreen-button');
        this.loadingIndicator = this.container.querySelector('.loading-indicator');
        this.fullscreenEnterIcon = this.container.querySelector('.fullscreen-enter');
        this.fullscreenExitIcon = this.container.querySelector('.fullscreen-exit');

        // Vimeo Player 생성
        this.createPlayer();

        // 이벤트 바인딩
        this.bindEvents();
    }

    getTemplate() {
        return `
            <!-- 영상 영역 -->
            <div class="video-wrapper relative bg-black rounded-t-lg overflow-hidden">
                <!-- Vimeo 임베드 영역 -->
                <div class="vimeo-embed aspect-video"></div>

                <!-- 로딩 인디케이터 -->
                <div class="loading-indicator absolute inset-0 flex items-center justify-center bg-black/50 z-30">
                    <div class="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
            </div>

            <!-- 영상 아래 컨트롤 바 -->
            <div class="controls-bar bg-black/90 px-4 py-3 rounded-b-lg border-t border-white/10">
                <!-- 진행 바 -->
                <div class="progress-bar w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer group">
                    <div class="progress-fill h-full bg-white rounded-full transition-all duration-100 relative" style="width: 0%">
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                </div>

                <!-- 컨트롤 버튼들 -->
                <div class="flex items-center justify-between">
                    <!-- 왼쪽: 재생/일시정지 버튼 + 시간 -->
                    <div class="flex items-center gap-4">
                        <!-- 재생 버튼 (일시정지 상태일 때만 표시) -->
                        <button class="play-button w-10 h-10 rounded-full bg-white flex items-center justify-center transition-all duration-200 hover:bg-white/90">
                            <svg class="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </button>
                        
                        <!-- 일시정지 버튼 (재생 중일 때만 표시) -->
                        <button class="pause-button w-10 h-10 rounded-full bg-white flex items-center justify-center transition-all duration-200 hover:bg-white/90 hidden">
                            <svg class="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                        </button>

                        <!-- 시간 표시 -->
                        <span class="time-display text-white/70 text-sm font-mono">0:00 / 0:00</span>
                    </div>

                    <!-- 오른쪽: 볼륨 + 전체화면 -->
                    <div class="flex items-center gap-4">
                        <!-- 볼륨 컨트롤 -->
                        <div class="volume-control flex items-center gap-2">
                            <button class="volume-button text-white hover:text-white/80 transition-colors">
                                <svg class="volume-high w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                </svg>
                                <svg class="volume-low w-5 h-5 hidden" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                                </svg>
                                <svg class="volume-muted w-5 h-5 hidden" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                                </svg>
                            </button>
                            <!-- 볼륨 슬라이더 (항상 표시) -->
                            <input type="range" class="volume-slider w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer" min="0" max="1" step="0.01" value="1">
                        </div>

                        <!-- 전체화면 버튼 -->
                        <button class="fullscreen-button w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                            <svg class="fullscreen-enter w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                            </svg>
                            <svg class="fullscreen-exit w-5 h-5 hidden" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createPlayer() {
        this.player = new Vimeo.Player(this.playerContainer, {
            id: parseInt(this.videoId),
            width: 640,
            controls: false,
            responsive: true,
            title: false,
            byline: false,
            portrait: false,
            dnt: true,
        });

        // 에러 핸들링 — 6종 분류 → 4종 학생 카피 + Supabase 자동 로깅
        this.player.on('error', async (error) => {
            console.error('Vimeo Player Error:', error);
            this.loadingIndicator.classList.add('hidden');

            // 1. 에러 분류
            const mapping = VIMEO_ERROR_MAP[error.name] || { copy: 'D', logName: 'Unknown' };

            // 2. 학생 화면 표시 (RangeError 등 IGNORE는 무시)
            if (mapping.copy !== 'IGNORE') {
                const template = COPY_TEMPLATES[mapping.copy];
                this.showError(template);
            }

            // 3. 백그라운드 로깅 (실패해도 학생 화면 영향 없음)
            try {
                await logPlaybackError({
                    error_name: mapping.logName,
                    error_message: (error && error.message) || '',
                    error_method: (error && error.method) || ''
                });
            } catch (logErr) {
                console.error('Failed to log playback error:', logErr);
            }
        });

        // 이벤트 리스너
        this.player.on('loaded', () => {
            this.isReady = true;
            this.loadingIndicator.classList.add('hidden');
            this.player.getDuration().then(d => {
                this.duration = d;
                this.updateTimeDisplay();
            });
            this.player.getVolume().then(v => {
                this.volume = v;
                this.volumeSlider.value = v;
            });
        });

        this.player.on('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
        });

        this.player.on('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
        });

        this.player.on('ended', () => {
            this.isPlaying = false;
            this.updatePlayButton();
        });

        this.player.on('timeupdate', (data) => {
            this.currentTime = data.seconds;
            this.updateProgress();
            this.updateTimeDisplay();
        });
    }

    bindEvents() {
        // 영상 클릭 시 재생/일시정지
        this.videoWrapper.addEventListener('click', () => this.togglePlay());

        // 재생 버튼
        this.playButton.addEventListener('click', () => this.togglePlay());
        
        // 일시정지 버튼
        this.pauseButton.addEventListener('click', () => this.togglePlay());

        // 진행 바 클릭
        this.progressBar.addEventListener('click', (e) => {
            const rect = this.progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.player.setCurrentTime(percent * this.duration);
        });

        // 볼륨 버튼
        this.volumeButton.addEventListener('click', () => this.toggleMute());

        // 볼륨 슬라이더
        this.volumeSlider.addEventListener('input', (e) => {
            this.volume = parseFloat(e.target.value);
            this.isMuted = this.volume === 0;
            this.player.setVolume(this.volume);
            this.updateVolumeIcon();
            this.updateVolumeSliderStyle();
        });
        
        // 초기 슬라이더 스타일
        this.updateVolumeSliderStyle();

        // 전체화면
        this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());

        // 전체화면 변경 감지 (모든 브라우저 지원)
        document.addEventListener('fullscreenchange', () => this.updateFullscreenIcon());
        document.addEventListener('webkitfullscreenchange', () => this.updateFullscreenIcon());
        document.addEventListener('mozfullscreenchange', () => this.updateFullscreenIcon());
        document.addEventListener('MSFullscreenChange', () => this.updateFullscreenIcon());
    }

    togglePlay() {
        if (this.isPlaying) {
            this.player.pause();
        } else {
            this.player.play();
        }
    }

    toggleMute() {
        if (this.isMuted) {
            this.player.setVolume(this.volume || 1);
            this.volumeSlider.value = this.volume || 1;
            this.isMuted = false;
        } else {
            this.player.setVolume(0);
            this.volumeSlider.value = 0;
            this.isMuted = true;
        }
        this.updateVolumeIcon();
        this.updateVolumeSliderStyle();
    }

    toggleFullscreen() {
        const elem = this.container;
        const isFullscreen = document.fullscreenElement ||
                            document.webkitFullscreenElement ||
                            document.mozFullScreenElement ||
                            document.msFullscreenElement;

        if (isFullscreen) {
            // 전체화면 종료
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        } else {
            // 전체화면 진입
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            } else if (this.player && this.player.requestFullscreen) {
                // Vimeo Player API 사용
                this.player.requestFullscreen();
            }
        }
    }

    updatePlayButton() {
        if (this.isPlaying) {
            // 재생 중: 재생 버튼 숨기고 일시정지 버튼 표시
            this.playButton.classList.add('hidden');
            this.pauseButton.classList.remove('hidden');
        } else {
            // 일시정지: 재생 버튼 표시하고 일시정지 버튼 숨김
            this.playButton.classList.remove('hidden');
            this.pauseButton.classList.add('hidden');
        }
    }

    updateProgress() {
        const percent = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
        this.progressFill.style.width = `${percent}%`;
    }

    updateTimeDisplay() {
        this.timeDisplay.textContent = `${this.formatTime(this.currentTime)} / ${this.formatTime(this.duration)}`;
    }

    updateVolumeIcon() {
        const high = this.container.querySelector('.volume-high');
        const low = this.container.querySelector('.volume-low');
        const muted = this.container.querySelector('.volume-muted');

        high.classList.add('hidden');
        low.classList.add('hidden');
        muted.classList.add('hidden');

        if (this.isMuted || this.volume === 0) {
            muted.classList.remove('hidden');
        } else if (this.volume < 0.5) {
            low.classList.remove('hidden');
        } else {
            high.classList.remove('hidden');
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    updateFullscreenIcon() {
        const isFullscreen = document.fullscreenElement ||
                            document.webkitFullscreenElement ||
                            document.mozFullScreenElement ||
                            document.msFullscreenElement;

        if (isFullscreen) {
            this.fullscreenEnterIcon.classList.add('hidden');
            this.fullscreenExitIcon.classList.remove('hidden');
        } else {
            this.fullscreenEnterIcon.classList.remove('hidden');
            this.fullscreenExitIcon.classList.add('hidden');
        }
    }

    updateVolumeSliderStyle() {
        const percent = (this.isMuted ? 0 : this.volume) * 100;
        this.volumeSlider.style.setProperty('--volume-percent', `${percent}%`);
    }

    showError(template) {
        // template = { title: '...', body: '...' }
        // 하위호환: 문자열 전달 시 D 카피로 자동 변환
        if (typeof template === 'string') {
            template = { title: '영상이 안 열려요', body: template };
        }
        this.videoWrapper.innerHTML = `
            <div class="aspect-video flex items-center justify-center bg-[#F5F5F5]">
                <div class="text-center text-[#2F2725] p-6 max-w-[340px]" style="font-family:'Pretendard Variable',Pretendard,sans-serif;letter-spacing:-0.02em;">
                    <svg class="w-12 h-12 mx-auto mb-4 text-[#8B95A1]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                    </svg>
                    <p class="text-[20px] font-bold mb-3" style="line-height:1.4;">${template.title}</p>
                    <p class="text-[14px] text-[#8B95A1]" style="line-height:1.7;">${template.body}</p>
                </div>
            </div>
        `;
        // 컨트롤 바 숨기기
        if (this.controlsBar) {
            this.controlsBar.style.display = 'none';
        }
    }

    // 외부 API
    play() { this.player?.play(); }
    pause() { this.player?.pause(); }
    setVolume(vol) { this.player?.setVolume(vol); }
    getCurrentTime() { return this.currentTime; }
    getDuration() { return this.duration; }
}

// 글로벌 함수로 노출
function createCustomVimeoPlayer(containerId, videoId, options = {}) {
    return new CustomVimeoPlayer(containerId, videoId, options);
}

// CSS 스타일 추가
const style = document.createElement('style');
style.textContent = `
    .custom-vimeo-player {
        border-radius: 0.5rem;
        overflow: hidden;
    }
    .custom-vimeo-player .volume-slider {
        background: linear-gradient(to right, white 0%, white var(--volume-percent, 100%), rgba(255,255,255,0.2) var(--volume-percent, 100%), rgba(255,255,255,0.2) 100%);
    }
    .custom-vimeo-player .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .custom-vimeo-player .volume-slider::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: none;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .custom-vimeo-player .progress-bar:hover .progress-fill {
        background: white;
    }
    .custom-vimeo-player .video-wrapper {
        cursor: pointer;
    }
`;
document.head.appendChild(style);





