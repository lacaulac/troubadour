const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
var UIStates = require('./UIStates');
const fs = require('fs');
const path = require('path');
const getAppDataPath = require('appdata-path');

const adapter = new FileSync(path.join(getAppDataPath.getAppDataPath(), "troubadour.db"));
const db = new lowdb(adapter);

bulmaToast.setDoc(window.document);
const defaultToastAnimation = { in: 'fadeIn', out: 'fadeOut' };


//Setting application state
var playlists = [];
var episodes = [];
//TODO Move the playlists and episodes into the ApplicationState
var ApplicationState = {
    UIState: UIStates.PLAYLISTS,
    UISettingsOn: false,
    currentPlaylistId: 0,
    currentEpisodeId: 0,
    playlists: playlists,
    episodes: episodes,
    isEditing: false,
    currentEpisode: null,
    isPlayingEpisode: false,
    playVolume: 1.0,
    shouldAutoPlay: false,
    cssFile: "css/default.min.css"
};

//Setting default database content
db.defaults({
    state: ApplicationState
}).write();

const dbfuncs = {
    save: function() {
        console.log("Saving the database");
        let oldState = ApplicationState.UIState;
        if(oldState == UIStates.LISTENTOEPISODE) {
            ApplicationState.currentEpisode.seconds = document.getElementsByTagName("audio")[0].currentTime;
            ApplicationState.playlists[ApplicationState.currentPlaylistId].audioFiles[ApplicationState.currentEpisodeId].seconds = ApplicationState.currentEpisode.seconds;
        }
        let arr = ApplicationState.episodes;
        ApplicationState.episodes = [];
        ApplicationState.UIState = UIStates.PLAYLISTS;
        ApplicationState.isEditing = false;
        ApplicationState.UISettingsOn = false;
        db.update('state', ApplicationState).write();
        ApplicationState.UIState = oldState;
        ApplicationState.episodes = arr;
    },
    load: function() {
        ApplicationState = db.get('state').value(); //Getting the playlists from the DB
    }
}

dbfuncs.load();

//Creating the playlist list vue
var playlistVue = new Vue({
    el: '#playlistList',
    data: {
        playlists: playlists,
        state: ApplicationState
    },
    methods: {
        onPlaylistClick: function(event, index) {
            this.state.UIState = UIStates.EPISODES;
            this.state.currentPlaylistId = index;
            this.state.episodes = this.state.playlists[this.state.currentPlaylistId].audioFiles;
        },
        deletePlaylist: function(event, index) {
            if(confirm(`Are you sure you wanna delete "${this.state.playlists[index].name}" ?`))
                this.state.playlists.splice(index, 1);
        },
        editPlaylistName: function(event, index) {
            let newName = prompt("New name:", this.state.playlists[index].name);
            if(newName != null)
            {
                this.state.playlists[index].name = newName;
                dbfuncs.save();
                this.state.isEditing = true;
            }
        },
        isPlaylistCompleted: function(index) {
            let pl = this.state.playlists[index];
            let isCompleted = true;
            pl.audioFiles.forEach(e => {
                if(!e.isCompleted)
                {
                    isCompleted = false;
                }
            });
            return isCompleted;
        }
    }
});

//Creating the episode list view
// https://jsfiddle.net/1vgLo8n3/
var episodeVue = new Vue({
    el: "#episodeList",
    data: {
        state: ApplicationState
    },
    methods: {
        onPlaylistClick: function(event, index) {
            this.state.UIState = UIStates.LISTENTOEPISODE;
            this.state.currentEpisodeId = index;
            this.state.currentEpisode = this.state.playlists[this.state.currentPlaylistId].audioFiles[index];
            setTimeout(loadAudio, 500);
        },
        deleteEpisode: function(event, index) {
            if(confirm(`Are you sure you wanna remove Episode ${index + 1}?`))
                this.state.playlists[this.state.currentPlaylistId].audioFiles.splice(index, 1);
        },
        editEpisodeName: function(event, index) {
            let newName = prompt("New name:", this.state.playlists[this.state.currentPlaylistId].audioFiles[index].name);
            if(newName != null)
            {
                this.state.playlists[this.state.currentPlaylistId].audioFiles[index].name = newName;
                dbfuncs.save();
                this.state.isEditing = true;
                this.state.UIState = UIStates.EPISODES;
            }
        }
    }
});

//Creating the stylesheet "view"
var stylesheetView = new Vue({
    el: "#stylesheet",
    data: {
        state: ApplicationState
    }
});

//Creating the listening view
var episodeVue = new Vue({
    el: "#listen",
    data: {
        state: ApplicationState
    }
});

//Creating the menu vue
var menuVue = new Vue({
    el: "#menu",
    data: {
        state: ApplicationState
    }
});

//Creating the settings view
var settingsVue = new Vue({
    el: "#settings",
    data: {
        state: ApplicationState,
        cssFiles: [
            "css/default.min.css",
            "css/cyborg.min.css",
            "css/darkly.min.css",
            "css/flatly.min.css",
            "css/minty.min.css",
            "css/solar.min.css",
            "css/superhero.min.css"
        ]
    }
});



//Development function to test adding a new playlist
function addNewSeries() {
    let plName = prompt("Playlist name:");
    if(plName == null)
        return;
    ApplicationState.playlists.push({
        name: plName,
        audioFiles: []
    });
    bulmaToast.toast({
        message: `Added ${name} to the series list`,
        type: "is-success",
        animate: defaultToastAnimation,
        position: "bottom-right"
    });
}

function addNewEpisodeFromDisk() {
    document.querySelector("#fileOpenDialog").click();
    document.querySelector("#fileOpenDialog").onchange = () => {
        document.querySelector("#fileOpenDialog").onchange = null;
        let filePath = document.querySelector("#fileOpenDialog").files[0].path;
        if(filePath == null)
            return;
        let name = filePath.split(path.sep)[filePath.split(path.sep).length-1].split(".").slice(0, -1).join(".");
        let newName = prompt("Episode name:", name);
        if(newName == null || newName == undefined)
            return;
        name = newName;
        ApplicationState.episodes.push({
            path: filePath,
            seconds: 0,
            name: name,
            isCompleted: false
        });
        bulmaToast.toast({
            message: `Added ${name} to ${ApplicationState.playlists[ApplicationState.currentPlaylistId].name}`,
            type: "is-success",
            animate: defaultToastAnimation,
            position: "bottom-right"
        });
    }
}

function addNewEpisodeFromURL() {
    let path = prompt("Episode URL:");
    if(path == null)
        return;
    let name = null;
    while(name == null) {
        name = prompt("Episode name:");
    }
    ApplicationState.episodes.push({
        path: path,
        seconds: 0,
        name: name,
        isCompleted: false
    });
    bulmaToast.toast({
        message: `Added ${name} to ${ApplicationState.playlists[ApplicationState.currentPlaylistId].name}`,
        type: "is-success",
        animate: defaultToastAnimation,
        position: "bottom-right"
    });
}

function removeWindowsLineReturn(str) {
    return str.split("\r").join("");
}

function onAudioEnd() {
    ApplicationState.currentEpisode.isCompleted = true;
    if(ApplicationState.shouldAutoPlay && (ApplicationState.currentEpisodeId + 1 < ApplicationState.episodes.length))
    {
        ApplicationState.UIState = UIStates.LISTENTOEPISODE;
        ApplicationState.currentEpisodeId = ApplicationState.currentEpisodeId + 1;
        ApplicationState.currentEpisode = ApplicationState.playlists[ApplicationState.currentPlaylistId].audioFiles[ApplicationState.currentEpisodeId];
        setTimeout(() => {
            let audioClip = document.getElementsByTagName("audio")[0];
            loadAudio();
            audioClip.oncanplay = function() {
                audioClip.play();
                bulmaToast.toast({
                    message: "Playing next episode",
                    type: "is-info",
                    animate: defaultToastAnimation,
                    position: "bottom-right"
                });
            }
        })
    }
}

function loadAudio() {
    ApplicationState.isPlayingEpisode = true;
    let audioClip = document.getElementsByTagName("audio")[0];
    //audioClip.src = ApplicationState.currentEpisode.path;
    audioClip.currentTime = ApplicationState.currentEpisode.seconds;
    audioClip.volume = ApplicationState.playVolume;
    audioClip.onended = onAudioEnd;
    audioClip.onpause = pauseAudio;
    audioClip.oncanplay = () => {
        audioClip.play();
        audioClip.saveInterval = setInterval(() => { ApplicationState.currentEpisode.seconds = audioClip.currentTime }, 10000); //Let's make sure progress is "saved" every 10 seconds
    }
    //audioClip.play();
}

function pauseAudio() {
    ApplicationState.isPlayingEpisode = false;
    let audioClip = document.getElementsByTagName("audio")[0];
    //audioClip.pause();
    ApplicationState.currentEpisode.seconds = audioClip.currentTime;
    ApplicationState.playVolume = audioClip.volume;
    dbfuncs.save();
}

function goBack() {
    switch(ApplicationState.UIState)
    {
        case UIStates.SETTINGS:
        case UIStates.ABOUT:
        case UIStates.EPISODES:
            ApplicationState.UIState = UIStates.PLAYLISTS;
            dbfuncs.save();
            break;
        case UIStates.LISTENTOEPISODE:
            pauseAudio();
            if(document.getElementsByTagName("audio")[0].saveInterval !== undefined) {
                clearInterval(document.getElementsByTagName("audio")[0].saveInterval);
                document.getElementsByTagName("audio")[0].saveInterval = undefined;
            }
            ApplicationState.UIState = UIStates.EPISODES;
            break;
    }
}

function resetSeriesProgression() {
    if(!confirm("Are you sure you wanna reset your progression in these series?"))
    {
        bulmaToast.toast({
            message: "Cancelled action",
            type: "is-danger",
            animate: defaultToastAnimation,
            position: "bottom-right"
        });
        return;
    }
    let au = ApplicationState.playlists[ApplicationState.currentPlaylistId].audioFiles
    for(let i=0; i<au.length; i++)
    {
        au[i].seconds = 0;
        au[i].isCompleted = false;
    }
    dbfuncs.save();
    ApplicationState.UIState = UIStates.EPISODES;
    bulmaToast.toast({
        message: "Deleted progression!",
        type: "is-success",
        animate: defaultToastAnimation,
        position: "bottom-right"
    });
}

function gotoLastListen() {
    ApplicationState.episodes = ApplicationState.playlists[ApplicationState.currentPlaylistId].audioFiles;
    ApplicationState.UIState = UIStates.LISTENTOEPISODE;
    setTimeout(loadAudio, 500);
    bulmaToast.toast({
        message: "Resumed listening!",
        type: "is-success",
        animate: defaultToastAnimation,
        position: "bottom-right"
    });
}

function isPathAbsoluteOrURL(path) {
    let regex = /^(http.*)|((.:)|\/)(.*(\/|\\).*)$/gm;
    return path.match(regex) !== null;
}

function importFromPlaylistFile() {
    document.querySelector("#fileOpenDialog").click();
    document.querySelector("#fileOpenDialog").onchange = () => {
        let plpath = document.querySelector("#fileOpenDialog").files[0].path;
        let i = 0, amount=0;
        let content = removeWindowsLineReturn(fs.readFileSync(plpath, "utf-8")).split('\n');
        let isM3U = content[0] == "#EXTM3U"; //Is the imported file a M3U8 file?
        let tmpName = "";
        content.forEach(line => {
            amount++;
            if(line.indexOf("#EXTINF:") != -1)
            {
                let arr = line.split(",");
                arr.splice(0, 1);
                tmpName = arr.join(",");
            }
            else if(line != "" && line.indexOf("#") == -1) {
                //If the path isn't absolute, let's make it so
                if(!isPathAbsoluteOrURL(line)) {
                    let tmpPath = plpath.split(path.sep);
                    tmpPath[tmpPath.length - 1] = line;
                    line = tmpPath.join(path.sep);
                }
                ApplicationState.episodes.push({
                    path: line,
                    seconds: 0,
                    name: isM3U?tmpName:`Episode ${++i}`,
                    isCompleted: false
                });
            }
        });
        dbfuncs.save();
        ApplicationState.UIState = UIStates.EPISODES;
        bulmaToast.toast({
            message: `Successfully imported ${amount} episodes`,
            type: "is-success",
            animate: defaultToastAnimation,
            position: "bottom-right"
        });
        document.querySelector("#fileOpenDialog").onchange = null;
    }
}

function exportToPlaylistFile() {

    document.querySelector("#fileSaveDialog").nwsaveas = `${ApplicationState.playlists[ApplicationState.currentPlaylistId].name}.m3u8`;
    document.querySelector("#fileSaveDialog").click();
    document.querySelector("#fileSaveDialog").onchange = () => {
        let path = document.querySelector("#fileSaveDialog").files[0].path;
        let buffer = `#EXTM3U\n#PLAYLIST:${ApplicationState.playlists[ApplicationState.currentPlaylistId].name}\n\n`;
        ApplicationState.episodes.forEach(ep => {
            buffer += `#EXTINF:420,${ep.name}\n` + ep.path + "\n";
        });
        fs.writeFileSync(path, buffer, "utf8");
        bulmaToast.toast({
            message: `Successfully exported all episodes to ${path}`,
            type: "is-success",
            animate: defaultToastAnimation,
            position: "bottom-right"
        });
        document.querySelector("#fileSaveDialog").onchange = null;
    }
}