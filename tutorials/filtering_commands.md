# Filtering Commands

The Palette Electron client sends all commands to the renderer. Filtering occurs in the Electron renderer, which is handled by Next JS. You can find the filtering behavior in /frontend/src/app/page.tsx

The filtering behavior affects which commands appear in the command list given the search term, and the order in which they appear.

## Search Term Filtering

### How it Works

For each command, we break the title, description, and tags into its component words, all lowercased.

So for example, If we have a command with the below properties:

    ```json
    {
        "title": "Hello World",
        "description": "A simple hello world command",
        "tags": ["Radical", "Aardvarks"]
    }
    ```

We would break the title, description, and tags into the following words:

    ```json
    ["hello", "world", "a", "command", "radical", "aardvarks"]
    ```

We then break the search term into a bag of words as well. So if we search `Hello world`, we would get the following bag of words:

    ```json
    ["hello", "world"]
    ```

We check for every search token if it is a prefix of any of the command's words. If every search token is a prefix of at least one of the command's words, we consider the command a match.

So in the above example, because `hello` and `world` are prefixes of `hello` and `world`, the command would be considered a match.

This also means that the search term `h w` would also be considered a match.

    ```json
    ["h", "w"]
    ```

Since it gets broken into the tokens `["h", "w"]`, and `h` is a prefix of `hello`, and `w` is a prefix of `world`.

But, the search term `h w z` would not be considered a match, because `z` is not a prefix of any of the command's words.

    ```json
    ["h", "w", "z"]
    ```

### Fast Searching

Below is a picture demonstrating the fast search that this feature enables us.

By searching for `sp r` we can find the `Spotify: Resume` command. `sp` is implicitly used as a shortcut for spotify, and `r` is used as a shortcut for resume.

### Aliases

It's easy to forget the exact name of a command, but tags give us a way to alias commands.

Given the below command:

    ```json
    {
        "title": "Quit",
        "description": "Quit the application",
        "tags": ["Exit"]
    }
    ```

## Most Recently Used (MRU) Filtering

## Search Term and MRU Filtering Combined
