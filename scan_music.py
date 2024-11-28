import os
import json
from pathlib import Path

def scan_music_directory():
    data_dir = Path('data')
    
    # 支持的音频格式
    audio_extensions = {'.mp3', '.m4a', '.wav', '.ogg', '.flac'}
    
    # 扫描每个集合目录
    for collection_dir in data_dir.iterdir():
        if collection_dir.is_dir() and not collection_dir.name.startswith('.'):
            songs = []
            
            # 扫描该集合中的所有音频文件
            for audio_file in collection_dir.rglob('*'):
                if audio_file.suffix.lower() in audio_extensions:
                    song = {
                        'title': audio_file.stem,
                        'file': str(audio_file.relative_to(collection_dir))
                    }
                    
                    # 检查是否存在同名的封面图片
                    cover_path = audio_file.with_suffix('.jpg')
                    if cover_path.exists():
                        song['cover'] = str(cover_path.relative_to(collection_dir))
                    
                    songs.append(song)
            
            if songs:  # 只为包含歌曲的目录生成配置文件
                # 为这个集合生成songs.json
                output = {'songs': songs}
                json_path = collection_dir / 'songs.json'
                
                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(output, f, ensure_ascii=False, indent=4)
                
                print(f'已生成 {json_path} 文件，包含 {len(songs)} 首歌曲')

if __name__ == '__main__':
    scan_music_directory() 