const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
var UIStates = require('./UIStates');
const fs = require('fs');

const adapter = new FileSync("db.json");
const db = new lowdb(adapter);

//Setting application state
var playlists = [];
var episodes = [];
//TODO Move the playlists and episodes into the ApplicationState
var ApplicationState = {
    UIState: UIStates.PLAYLISTS,
    currentPlaylistId: 0,
    currentEpisodeId: 0,
    playlists: playlists,
    episodes: episodes,
    isEditing: false,
    currentEpisode: null,
    isPlayingEpisode: false,
    playVolume: 1.0
};

//Setting default database content
db.defaults({
    state: ApplicationState
}).write();

const dbfuncs = {
    save: function() {
        console.log("Saving the database");
        let arr = ApplicationState.episodes;
        ApplicationState.episodes = [];
        ApplicationState.UIState = UIStates.PLAYLISTS;
        ApplicationState.isEditing = false;
        db.update('state', ApplicationState).write();
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

//Creating the listening view
var settingsVue = new Vue({
    el: "#settings",
    data: {
        state: ApplicationState
    },
    methods: {
        clickOnButton: function() {
            this.state.UIState = UIStates.SETTINGS;
        }
    }
});

//Creating the about view
var aboutVue = new Vue({
    el: "#about",
    data: {
        state: ApplicationState
    },
    methods: {
        clickOnButton: function() {
            this.state.UIState = UIStates.ABOUT;
        }
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
}

function addNewEpisode() {
    let path = prompt("Path to episode:");
    if(path == null)
        return;
    ApplicationState.episodes.push({
        path: path,
        seconds: 0
    });
}

function removeWindowsLineReturn(str) {
    return str.split("\r").join("");
}

function onAudioEnd() {
    ApplicationState.currentEpisode.isCompleted = true;
}

function loadAudio() {
    ApplicationState.isPlayingEpisode = true;
    let audioClip = document.getElementsByTagName("audio")[0];
    //audioClip.src = ApplicationState.currentEpisode.path;
    audioClip.currentTime = ApplicationState.currentEpisode.seconds;
    audioClip.volume = ApplicationState.playVolume;
    audioClip.onended = onAudioEnd;
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
            ApplicationState.UIState = UIStates.EPISODES;
            break;
    }
}

function resetSeriesProgression() {
    if(!confirm("Are you sure you wanna reset your progression in these series?"))
        return;
    let au = ApplicationState.playlists[ApplicationState.currentPlaylistId].audioFiles
    for(let i=0; i<au.length; i++)
    {
        au[i].seconds = 0;
        au[i].isCompleted = false;
    }
    dbfuncs.save();
    ApplicationState.UIState = UIStates.EPISODES;
}

function gotoLastListen() {
    ApplicationState.episodes = ApplicationState.playlists[ApplicationState.currentPlaylistId].audioFiles;
    ApplicationState.UIState = UIStates.LISTENTOEPISODE;
    setTimeout(loadAudio, 500);
}

function importFromPlaylistFile() {
    let path = prompt("Enter path to playlist file:");
    if(path == null)
        return;
    let i = 0;
    let content = removeWindowsLineReturn(fs.readFileSync(path, "utf-8")).split('\n');
    content.forEach(line => {
        if(line.indexOf("#") == -1 && line != "") {
            ApplicationState.episodes.push({
                path: line,
                seconds: 0,
                name: `Episode ${++i}`,
                isCompleted: false
            });
        }
    });
    dbfuncs.save();
    ApplicationState.UIState = UIStates.EPISODES;
}

function exportToPlaylistFile() {
    let path = prompt("Enter path to playlist file:");
    if(path == null)
        return;
    let buffer = `#EXTM3U\n#PLAYLIST:${ApplicationState.playlists[ApplicationState.currentPlaylistId].name}\n\n`;
    ApplicationState.episodes.forEach(ep => {
        buffer += ep.path + "\n";
    });
    fs.writeFileSync(path, buffer, "utf8");
}