import spotipy
import os
from spotipy.oauth2 import SpotifyPKCE
from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from src.cmd_types import CommandList, Command


router = APIRouter(prefix="/spotify")

# Set up authentication
# I think we need an oauth server for this to work...

sp_oauth = SpotifyPKCE(
    client_id="01daafd66f6c494ebeeabd46619b1082",
    redirect_uri="http://127.0.0.1:51032/spotify/callback",
    scope="user-modify-playback-state,user-read-playback-state",
)
sp = spotipy.Spotify(auth_manager=sp_oauth)


def play_song(song_uri):
    """Play a song by its URI"""
    sp.start_playback(uris=[song_uri])


def stop_song():
    """Stop the current song"""
    sp.pause_playback()


def resume_song():
    """Resume the current song"""
    sp.start_playback()


def skip_song():
    """Skip the current song"""
    sp.next_track()


def shuffle_playback(state=True):
    """Turn shuffle on or off"""
    sp.shuffle(state=state)


def get_commands():
    commands = [
        Command(
            title="Spotify: Play Song",
            description="Play a song by its URI",
            command=play_song,
        ),
        Command(
            title="Spotify: Stop Song",
            description="Stop the current song",
            command=stop_song,
            tags=["pause", "stop"],
        ),
        Command(
            title="Spotify: Resume Song",
            description="Resumes the current song",
            command=resume_song,
            tags=["play", "resume"],
        ),
        Command(
            title="Spotify: Shuffle Playback",
            description="Turn shuffle on or off",
            command=shuffle_playback,
            tags=["shuffle", "random"],
        ),
        Command(
            title="Spotify: Skip Song",
            description="Skip the current song",
            command=skip_song,
            tags=["next", "skip"],
        ),
    ]

    for command in commands:
        command.icon = "/icons/spotify.webp"

    return commands


@router.get("/callback")
def callback():
    # oauth_token is set from parameters to this call
    # oauth_token =
    # print(request.url)
    # code = sp_oauth.parse_response_code(request.url)
    # token_info

    return {"message": "Callback route for Spotify authentication"}


# Example usage
# play_song("spotify:track:TRACK_ID")  # Replace TRACK_ID with the ID of the track
# shuffle_playback(True)
# stop_song()
