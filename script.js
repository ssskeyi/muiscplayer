class MusicPlayer {
    constructor() {
        this.collections = {};
        this.currentCollection = null;
        this.currentSongIndex = -1;
        this.isPlaying = false;
        this.repeatMode = 'none'; // none, one, all
        this.shuffleMode = false;
        this.shuffleQueue = [];

        // DOM elements
        this.audioPlayer = document.getElementById('audio-player');
        this.playButton = document.getElementById('play');
        this.prevButton = document.getElementById('prev');
        this.nextButton = document.getElementById('next');
        this.shuffleButton = document.getElementById('shuffle');
        this.repeatButton = document.getElementById('repeat');
        this.progressBar = document.querySelector('.progress-bar');
        this.progress = document.querySelector('.progress');
        this.currentTimeSpan = document.getElementById('current-time');
        this.durationSpan = document.getElementById('duration');
        this.collectionsListDiv = document.getElementById('collections-list');
        this.songsListUl = document.getElementById('songs-list');
        this.currentSongDisplay = document.getElementById('current-song');
        this.currentCollectionDisplay = document.getElementById('current-collection');
        this.albumCover = document.getElementById('album-cover');

        // 默认封面路径
        this.defaultCover = 'data/default-album.jpg';
        
        this.initializeEventListeners();
        this.loadCollections();
    }

    async loadCollections() {
        try {
            // 获取合集列表
            const collections = ['2023', '2024']; // 这里硬编码你的合集名称
            
            for (const collection of collections) {
                const response = await fetch(`data/${collection}/songs.json`);
                if (response.ok) {
                    const data = await response.json();
                    this.collections[collection] = data.songs;
                    this.createCollectionElement(collection);
                }
            }
        } catch (error) {
            console.error('Error loading collections:', error);
        }
    }

    createCollectionElement(collection) {
        const div = document.createElement('div');
        div.textContent = collection;
        div.onclick = () => this.selectCollection(collection);
        this.collectionsListDiv.appendChild(div);
    }

    selectCollection(collection) {
        this.currentCollection = collection;
        this.currentCollectionDisplay.textContent = collection;
        this.updateSongsList();
        
        // 移除其他合集的active类
        this.collectionsListDiv.querySelectorAll('div').forEach(div => {
            div.classList.remove('active');
            if (div.textContent === collection) {
                div.classList.add('active');
            }
        });
    }

    updateSongsList() {
        this.songsListUl.innerHTML = '';
        const songs = this.collections[this.currentCollection];
        songs.forEach((song, index) => {
            const li = document.createElement('li');
            li.textContent = song.title;
            li.onclick = () => this.playSong(index);
            this.songsListUl.appendChild(li);
        });
    }

    playSong(index) {
        if (this.currentCollection && this.collections[this.currentCollection]) {
            const songs = this.collections[this.currentCollection];
            if (index >= 0 && index < songs.length) {
                this.currentSongIndex = index;
                const song = songs[index];
                this.audioPlayer.src = `data/${this.currentCollection}/${song.file}`;
                this.currentSongDisplay.textContent = song.title;
                
                // 设置封面图片，如果没有则使用默认封面
                if (song.cover) {
                    this.albumCover.src = `data/${this.currentCollection}/${song.cover}`;
                } else {
                    this.albumCover.src = this.defaultCover;
                }
                
                this.audioPlayer.play();
                this.isPlaying = true;
                this.updatePlayButton();
                this.updateSongsList();
                
                // 更新播放列表中的active状态
                this.songsListUl.querySelectorAll('li').forEach((li, i) => {
                    li.classList.toggle('active', i === index);
                });
            }
        }
    }

    togglePlay() {
        if (this.audioPlayer.src) {
            if (this.isPlaying) {
                this.audioPlayer.pause();
            } else {
                this.audioPlayer.play();
            }
            this.isPlaying = !this.isPlaying;
            this.updatePlayButton();
        }
    }

    updatePlayButton() {
        this.playButton.innerHTML = this.isPlaying ? 
            '<i class="fas fa-pause"></i>' : 
            '<i class="fas fa-play"></i>';
    }

    playNext() {
        if (!this.currentCollection) return;
        
        const songs = this.collections[this.currentCollection];
        let nextIndex;

        if (this.shuffleMode) {
            if (this.shuffleQueue.length === 0) {
                this.generateShuffleQueue();
            }
            nextIndex = this.shuffleQueue.pop();
        } else {
            nextIndex = this.currentSongIndex + 1;
            if (nextIndex >= songs.length) {
                nextIndex = 0;
            }
        }

        this.playSong(nextIndex);
    }

    playPrevious() {
        if (!this.currentCollection) return;
        
        const songs = this.collections[this.currentCollection];
        let prevIndex = this.currentSongIndex - 1;
        if (prevIndex < 0) {
            prevIndex = songs.length - 1;
        }
        this.playSong(prevIndex);
    }

    toggleShuffle() {
        this.shuffleMode = !this.shuffleMode;
        this.shuffleButton.classList.toggle('button-active', this.shuffleMode);
        if (this.shuffleMode) {
            this.generateShuffleQueue();
        }
    }

    generateShuffleQueue() {
        const songs = this.collections[this.currentCollection];
        this.shuffleQueue = Array.from({length: songs.length}, (_, i) => i)
            .filter(i => i !== this.currentSongIndex);
        for (let i = this.shuffleQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffleQueue[i], this.shuffleQueue[j]] = 
            [this.shuffleQueue[j], this.shuffleQueue[i]];
        }
    }

    toggleRepeat() {
        const modes = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        
        // 更新重复按钮的图标
        switch(this.repeatMode) {
            case 'none':
                this.repeatButton.innerHTML = '<i class="fas fa-redo"></i>';
                this.repeatButton.classList.remove('button-active');
                break;
            case 'one':
                this.repeatButton.innerHTML = '<i class="fas fa-redo-alt"></i>';
                this.repeatButton.classList.add('button-active');
                break;
            case 'all':
                this.repeatButton.innerHTML = '<i class="fas fa-retweet"></i>';
                this.repeatButton.classList.add('button-active');
                break;
        }
    }

    updateProgress(e) {
        const { duration, currentTime } = this.audioPlayer;
        const progressPercent = (currentTime / duration) * 100;
        this.progress.style.width = `${progressPercent}%`;
        
        // 更新时间显示
        this.currentTimeSpan.textContent = this.formatTime(currentTime);
        this.durationSpan.textContent = this.formatTime(duration);
    }

    setProgress(e) {
        const width = this.progressBar.clientWidth;
        const clickX = e.offsetX;
        const duration = this.audioPlayer.duration;
        this.audioPlayer.currentTime = (clickX / width) * duration;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    initializeEventListeners() {
        // 播放控制
        this.playButton.addEventListener('click', () => this.togglePlay());
        this.prevButton.addEventListener('click', () => this.playPrevious());
        this.nextButton.addEventListener('click', () => this.playNext());
        this.shuffleButton.addEventListener('click', () => this.toggleShuffle());
        this.repeatButton.addEventListener('click', () => this.toggleRepeat());

        // 进度条控制
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.progressBar.addEventListener('click', (e) => this.setProgress(e));

        // 音频结束时的处理
        this.audioPlayer.addEventListener('ended', () => {
            if (this.repeatMode === 'one') {
                this.audioPlayer.currentTime = 0;
                this.audioPlayer.play();
            } else if (this.repeatMode === 'all' || this.shuffleMode) {
                this.playNext();
            } else if (this.currentSongIndex < this.collections[this.currentCollection].length - 1) {
                this.playNext();
            }
        });
    }
}

// 初始化播放器
const player = new MusicPlayer(); 