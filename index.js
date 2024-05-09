// 文件读取
const fileButton = document.getElementById('file');
fileButton.addEventListener('click', async function () {
    try {
            const directoryHandle = await window.showDirectoryPicker();
            const allFiles = await getFilesRecursively(directoryHandle);
            // console.log(allFiles);

            // 构建播放列表
            const playlist = await createPlaylist(allFiles);
            const audioList = document.getElementById('audio-list');
            // 渲染播放列表
            for (let i = 0; i < playlist.length; i++) {
                const {name} = playlist[i]
                // const item = playlist[i];
                const li = document.createElement('li');
                li.textContent = name;
                audioList.appendChild(li);
            }

            // 初始化播放索引
            let currentIndex = 0;

            // 封装播放函数
            function play (index) {
                if (index < 0 || index >= playlist.length) return; // 索引越界检查
                // 给正在播放的li添加样式
                const allList = document.getElementById('audio-list').children;
                for (let i = 0; i < allList.length; i++) {
                    allList[i].classList.remove('playing');
                }
                if (allList[index]) {
                    allList[index].classList.add('playing');
                }
                const {src} = playlist[currentIndex];
                const audio = document.getElementById('audio');
                audio.src = src;
                audio.play();
                audio.onended = () => {
                    currentIndex = (currentIndex + 1) % playlist.length;
                    play(currentIndex);
                }

            }

            // 随机播放函数
            function randomPlay (index) {
                if (index < 0 || index >= playlist.length) return; // 索引越界检查
                // 给正在播放的li添加样式
                const allList = document.getElementById('audio-list').children;
                for (let i = 0; i < allList.length; i++) {
                    allList[i].classList.remove('playing');
                }
                if (allList[index]) {
                    allList[index].classList.add('playing');
                }
                const {src} = playlist[currentIndex];
                const audio = document.getElementById('audio');
                audio.src = src;
                audio.play().then(() => {
                    audio.addEventListener('ended', () => {
                        currentIndex = (currentIndex + Math.floor(Math.random() * playlist.length)) % playlist.length;
                        randomPlay(currentIndex);
                    });
                }).catch(() => {
                    console.log();
                })
            }

        
            // 点击切换上一首
            document.getElementById('up').addEventListener('click', () => {
                currentIndex--;
                // 判断是否到第一首
                if (currentIndex < 0) {
                    currentIndex = playlist.length - 1;
                }
                play(currentIndex);
                updateJindu();
            });

            // 点击切换下一首
            document.getElementById('next').addEventListener('click', () => {
                currentIndex++;
                // 判断是否到最后一首
                if (currentIndex >= playlist.length) {
                    currentIndex = 0;
                }
                play(currentIndex);
                updateJindu();
            })

            // 随机播放
            document.getElementById('random').addEventListener('click', () => {
                currentIndex = Math.floor(Math.random() * playlist.length);     
                randomPlay(currentIndex);
                updateJindu();
            })
            
            // 开始播放第一首
            document.getElementById('start').addEventListener('click', () => {
                play(currentIndex);
                updateJindu();
            });

            // 暂停
            document.getElementById('stop').addEventListener('click', (e) => {
                const audio = document.getElementById('audio');
                if (e.detail === 1) {
                    audio.pause();  
                }else if (e.detail === 2) {
                    audio.play();
                }
            });

            // 点击播放列表播放
            audioList.addEventListener('click', (e) => {
                const target = e.target;
                if (target.tagName === 'LI') {
                    const index = Array.from(target.parentNode.children).indexOf(target);
                    currentIndex = index;
                    play(currentIndex);
                    updateJindu();
                }
            });
            

            // 更新进度条
            let updateProgressRAF;
            const jindu = document.getElementById('range');
            function updateJindu() {
                const audio = document.getElementById('audio');
                if (audio.paused || audio.ended) {
                    if (audio.ended) {
                        jindu.value = jindu.max;
                        cancelAnimationFrame(updateProgressRAF);
                    }
                    return;
                }
                // 正确计算进度条的值
                jindu.value = (audio.currentTime / audio.duration) * 100;
                updateProgressRAF = requestAnimationFrame(updateJindu);
            }

            // 进度条变化时，跳转播放位置
            jindu.addEventListener('input', () => {
                const audio = document.getElementById('audio');
                audio.currentTime = (jindu.value / 100) * audio.duration;
            });

            // 初始化进度条最大值
            audio.addEventListener('loadedmetadata', () => {
                jindu.max = Math.floor(AudioBuffer.duration);
            });

    } catch (error) {
        alert('已取消或发生错误');
    }
});

// 创建播放列表
async function createPlaylist(files) {
    const playlist = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const blob = await file.getFile();
        const blobUrl = URL.createObjectURL(blob);
        playlist.push({ name: file.name, src: blobUrl });
    }
    return playlist;
}

// 递归读取文件夹及其子文件夹中的所有文件
async function getFilesRecursively (dirHandle) {
    // 将文件放到数组里面
    let files = [];

    // 遍历当前目录下的条目
    for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
            // 如果是文件，直接添加到列表
            files.push(entry);
        } else if (entry.kind === 'directory') {
            // 如果是目录，递归获取该目录下的所有文件，并合并结果
            const subFiles = await getFilesRecursively(entry);
            files = files.concat(subFiles);
        }
    }

    return files;
}
