const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
var UIStates = require('./UIStates');

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

//Development function to test adding a new playlist
function addNewSeries() {
    let plName = prompt("Playlist name:");
    ApplicationState.playlists.push({
        name: plName,
        audioFiles: []
    });
}

function addNewEpisode() {
    let path = prompt("Path to episode:");
    ApplicationState.episodes.push({
        path: path,
        seconds: 0
    });
}

function loadAudio() {
    ApplicationState.isPlayingEpisode = true;
    let audioClip = document.getElementsByTagName("audio")[0];
    //audioClip.src = ApplicationState.currentEpisode.path;
    audioClip.currentTime = ApplicationState.currentEpisode.seconds;
    audioClip.volume = ApplicationState.playVolume;
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

//Definitely not a debug function
function backToPlaylists() {
    ApplicationState.UIState = UIStates.PLAYLISTS;
}

function goBack() {
    switch(ApplicationState.UIState)
    {
        case UIStates.EPISODES:
            ApplicationState.UIState = UIStates.PLAYLISTS;
            break;
        case UIStates.LISTENTOEPISODE:
            console.log("Gonig back from episode playing");
            pauseAudio();
            ApplicationState.UIState = UIStates.EPISODES;
            break;
    }
}

const TimeUtils = {
    getMinutes: function(secs) {
        let s = Math.round(secs);
        return (s - (s%60))/60;
    },
    getSeconds: function(secs) {
        let s = Math.round(secs);
        return s % 60;
    }
}

function gotoLastListen() {
    ApplicationState.episodes = ApplicationState.playlists[ApplicationState.currentPlaylistId].audioFiles;
    ApplicationState.UIState = UIStates.LISTENTOEPISODE;
    setTimeout(loadAudio, 500);
}