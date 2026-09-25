#!/usr/bin/env python3
"""
Spectrogram Generator for PSI Inspection Reports
Generates a mel-spectrogram PNG from an audio or video file.

Usage:
    python3 generate_spectrogram.py <audio_or_video_path> [output_path] [title]

Examples:
    python3 generate_spectrogram.py audio.wav
    python3 generate_spectrogram.py inspection.mov spectrogram.png "Acoustic Spectral Analysis"
    python3 generate_spectrogram.py video.mp4 -  # auto-generates output path

If input is a video file, audio is extracted via ffmpeg first.
"""

import sys
import os
import subprocess
import tempfile

# Must set Agg backend BEFORE importing pyplot
import matplotlib
matplotlib.use('Agg')

import matplotlib.pyplot as plt
import numpy as np

try:
    import librosa
    import librosa.display
except ImportError:
    print("ERROR: librosa not installed. Run: pip3 install librosa matplotlib scipy")
    sys.exit(1)


def extract_audio_from_video(video_path: str, output_wav: str) -> str:
    """Extract audio from video file as 16-bit mono WAV using ffmpeg."""
    cmd = [
        'ffmpeg', '-i', video_path,
        '-vn',                    # no video
        '-acodec', 'pcm_s16le',   # 16-bit PCM
        '-ar', '22050',           # 22050 Hz sample rate
        '-ac', '1',               # mono
        '-y',                     # overwrite
        output_wav
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr[:500]}")
    return output_wav


def generate_spectrogram(
    audio_path: str,
    output_path: str = "spectrogram.png",
    title: str = "Acoustic Spectral Analysis",
    figsize: tuple = (12, 5),
    dpi: int = 150,
    n_mels: int = 128,
    fmin: float = 20.0,
    fmax: float = 11025.0,
    hop_length: int = 512,
    n_fft: int = 2048,
    cmap: str = "inferno",
) -> str:
    """
    Generate a mel-spectrogram image from an audio file.

    Returns the path to the generated PNG.
    """
    # Load audio
    print(f"Loading audio: {audio_path}")
    y, sr = librosa.load(audio_path, sr=22050, mono=True)
    duration = len(y) / sr
    print(f"  Duration: {duration:.1f}s, Sample rate: {sr}Hz, Samples: {len(y)}")

    # Compute mel-spectrogram
    print("Computing mel-spectrogram...")
    S = librosa.feature.melspectrogram(
        y=y, sr=sr,
        n_mels=n_mels, fmin=fmin, fmax=fmax,
        hop_length=hop_length, n_fft=n_fft,
    )

    # Convert to dB scale
    S_dB = librosa.power_to_db(S, ref=np.max)
    print(f"  Spectrogram shape: {S_dB.shape} (freq_bins × time_frames)")
    print(f"  dB range: {S_dB.min():.1f} to {S_dB.max():.1f}")

    # Create figure with dark theme
    fig, ax = plt.subplots(figsize=figsize, dpi=dpi)
    fig.patch.set_facecolor('#0c1e35')
    ax.set_facecolor('#0c1e35')

    # Render spectrogram
    img = librosa.display.specshow(
        S_dB, sr=sr, hop_length=hop_length,
        x_axis='time', y_axis='mel',
        fmin=fmin, fmax=fmax, ax=ax, cmap=cmap,
    )

    # Colorbar
    cbar = fig.colorbar(img, ax=ax, format='%+2.0f dB', pad=0.02)
    cbar.ax.yaxis.set_tick_params(color='white')
    cbar.ax.yaxis.label.set_color('white')
    plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color='white')

    # Labels
    ax.set_title(title, color='white', fontsize=14, fontweight='bold', pad=12)
    ax.set_xlabel('Time (seconds)', color=(1, 1, 1, 0.7), fontsize=11)
    ax.set_ylabel('Frequency (Hz)', color=(1, 1, 1, 0.7), fontsize=11)
    ax.tick_params(colors=(1, 1, 1, 0.6))
    for spine in ax.spines.values():
        spine.set_edgecolor((1, 1, 1, 0.2))

    # Save
    plt.tight_layout()
    plt.savefig(output_path, dpi=dpi, bbox_inches='tight',
                facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()

    file_size = os.path.getsize(output_path)
    print(f"Spectrogram saved: {output_path} ({file_size / 1024:.1f} KB)")
    return output_path


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != '-' else None
    title = sys.argv[3] if len(sys.argv) > 3 else "Acoustic Spectral Analysis"

    if not os.path.exists(input_path):
        print(f"ERROR: File not found: {input_path}")
        sys.exit(1)

    # Determine if input is video or audio
    video_extensions = ('.mov', '.mp4', '.avi', '.mkv', '.wmv', '.flv', '.webm')
    is_video = input_path.lower().endswith(video_extensions)

    audio_path = input_path
    cleanup = False

    if is_video:
        print(f"Input is video: {input_path}")
        print("Extracting audio with ffmpeg...")
        tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        audio_path = extract_audio_from_video(input_path, tmp.name)
        cleanup = True

    # Auto-generate output path if not specified
    if output_path is None:
        base = os.path.splitext(os.path.basename(input_path))[0]
        output_path = f"{base}_spectrogram.png"

    try:
        generate_spectrogram(audio_path, output_path, title)
    finally:
        if cleanup and os.path.exists(audio_path):
            os.unlink(audio_path)
            print(f"Cleaned up temp audio: {audio_path}")


if __name__ == '__main__':
    main()
