import spotipy
import os
from spotipy.oauth2 import SpotifyOAuth
from fastapi import FastAPI, APIRouter
from src.types import CommandList, Command


router = APIRouter(prefix="/spotify")
oauth_token = None

# Set up authentication
sp = spotipy.Spotify(
    auth_manager=SpotifyOAuth(
        client_id="01daafd66f6c494ebeeabd46619b1082",
        client_secret=os.getenv("SPOTIFY_CLIENT_SECRET"),
        redirect_uri="http://127.0.0.1:8000/spotify/callback",
        scope="user-modify-playback-state,user-read-playback-state",
    )
)


def play_song(song_uri):
    """Play a song by its URI"""
    sp.start_playback(uris=[song_uri])


def stop_song():
    """Stop the current song"""
    sp.pause_playback()


def shuffle_playback(state=True):
    """Turn shuffle on or off"""
    sp.shuffle(state=state)


def get_commands():
    return [
        Command(
            title="Spotify: Play Song",
            description="Play a song by its URI",
            command=play_song,
        ),
        Command(
            title="Spotify: Stop Song",
            description="Stop the current song",
            command=stop_song,
        ),
        Command(
            title="Spotify: Shuffle Playback",
            description="Turn shuffle on or off",
            command=shuffle_playback,
        ),
    ]


@router.get("/callback")
def callback():
    # oauth_token is set from parameters to this call
    # oauth_token =
    return {"message": "Callback route for Spotify authentication"}


# Example usage
# play_song("spotify:track:TRACK_ID")  # Replace TRACK_ID with the ID of the track
# shuffle_playback(True)
# stop_song()
