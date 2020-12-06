WebInfo
=======

A program to steal user information through a simple link

Requirements
------------

* NodeJS 14+
* Any browser with ES6 support

Installation
------------

Make sure you have created and copied the required HTTPS files under `/WebInfo/src/server` (*private.key*, *certificate.crt* and *ca_bundle.crt*).

`:/WebInfo/src$ npm install`

`:/WebInfo/src$ npm start`

Minimal Example
---------------

Here is a list of instructions for a minimal example:

1. Make sure the server is running:

    ```bash
    :/WebInfo/src$ npm start
    listening on localhost:70

    ```

2. Run the interactive shell in a seperate terminal window:

    ```bash
    :/WebInfo/src$ node server.js
    Server already listenning on localhost:70. Interactive shell started.

    ```

3. Add a new URL entry to the list. This is going to register a new redirection URL.

   ```bash
    > add
    URL: test
    Comment: a minimal example
    Redirection URL: google.com
    Maximum Usage: -1
    Items:
        [-1]       test->google.com: a minimal example

    >
   ```

4. Navigate to `https://localhost:70/test` on a web browser. This simulates a victim clicking a malicious link to this program. You should them be redirected to *google.com*.
5. View the information saved.

    ```bash
    > view
    URL: test
    ```

    The program should then output something like the following, which includes all the information the program was able to retreive from the victim:

    ```bash
    --------------------------------------------------
    general
        datetimeClient: 2020-12-06, 17:15:38
        userAgent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.67 Safari/537.36 Edg/87.0.664.55
        referer: [direct navigation]
        online: yes
        language: en-US
        connectionType: 4g
        datetimeServer: 2020-12-06, 17:15:38
        browser: Edge 87.0.664.55
    CPU
        platform: Win32
        cores: 4 cores
        oscpu: [unknown]
        architecture: amd64
    GPU
        renderer: ANGLE (AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0)
        vendor: Google Inc.
    RAM: 8 GB
    device
        touchSupport: yes
        vendor: undefined
        model: undefined
        type: undefined
        operatingSystem: Windows 10
    screen
        width: 1536 pixels
        height: 864 pixels
        pixelDepth: 24 bits / pixel
        orientation: landscape
    battery
        charging: no
        level: 63%
    sensors
        absolute: false
        position: stable
        brightness: [access denied]
        proximity: [access denied]
    location
        publicIP: ::1
        location: [not found]




    >
    ```

Usage
-----

You can register multiple URLs that will be used as a malicious link. Once you register a URL, you can set properties such as its maximum usage or the website it will redirect to when a victim clicks on the malicious link.

Here is a list of commands that can be used within the interactive shell of this program:

* `help`: Displays the help page
* `exit`: Exits the program
* `add`: Adds an item to the list
  * `URL`: The relative URL of the link that will be created. For example, if `URL` is `test`, then the victim will have to open `https://localhost:70/test` to get their informations stealed. An empty URL will default to a random 5-digit number.
  * `Comment`: A comment to remember what this URL is used for.
  * `Redireciton URL`: The URL to which the victim will be redirected to once all their information will have been saved.
  * `Maximum Usage`: The maximum amount of times that the URL can be used. This number decrements every time the victim opens up the URL in a web browser. Once it reaches `0`, the victim will get a timeout error instead of a redirect. Useful if you want to prevent a suspecting victim from investigating what really happened when he/she clicked the malicious link. Entering a negative number will simple decrement to negative infinity, which means that the URL will work until it is deleted using the `rm` command.
* `rm`: Removes an item from the list
  * `URL`: Enter the URL to remove
* `edit`: Edits an item from the list
  * `URL`: Enter the URL to be edited
  * The program will then ask you the exact same thing as with the `add` command. If you wish to keep a field the same, just leave it empty. If you wish to modify a field, enter a value and hit *enter*.
* `list`: Lists all the currently registered items
* `view`: Shows the information saved from a URL
  * `URL`: Enter the URL to see the information saved from when a victim clicked a malicious link
* `clr`: Clears the information saved from a URL
  * `URL`: Enter the URL to clear all the information saved
