1. Unfriend functionality
2. Add queue to backend requests using Kue and redis

RECENTLY FIXED
- Friends list updates after removing friend

OLD CODE

// May be useful for implementing tricky one time state changes at component load
if (!prevState.username) { // Checks for previous state username false, this state logged in true, set timeout to query pending friend requests. If user was not logged in before but is logged in now, set a timeout query to get pending requests only if username is true
    if (this.state.isLoggedIn) {
        setTimeout((e) => {
            if (!this.pendingfriendrequests) {
                console.log(this.state.updateInc);
                if (this.state.updateInc < 1) {
                    if (username) { // Only increment update state if username is set to true
                        console.log("Update increment state: ", this.state.updateInc);
                        this.setState({ updateInc: this.state.updateInc + 1 });
                        this.getpendingrequests("hidden", null, username);
                    }
                }
            }
        }, 500)
    }
} else {
    if (this.state.updateInc < 1) {
        if (username) {
            console.log("Update increment state: ", this.state.updateInc);
            this.setState({ updateInc: this.state.updateInc + 1 });
            this.getpendingrequests("hidden", null, username);
        }
    }
}


// friends function for checking current chat length on load, useless?
componentDidMount() {
        let currentchatlength;
        for (let i = 0; i < this.props.conversations.length; i++) { // Determines the length of this friend chat and returns chat length
            if (this.props.conversations[i].users.length == 2) {
                for (let j = 0; j < this.props.conversations[i].users.length; j++) {
                    if (this.props.conversations[i].users[j] === this.props.friend) {
                        currentchatlength = this.props.conversations[i].log.length;
                        log(this.props.conversations[i].log.length + this.props.friend);
                    }
                }
            }
        }

        if (this.state.chatlength == null) {
            this.setState({ chatlength: currentchatlength }); // Sets length of chat when it is equal to null at componentDidMount
        }
    }


// Was used for a scrolling function on early component load
// if (this.scrollRef.current.scrollHeight <= 30) { // Fixes chat that doesnt scroll down on new "typing" new load
//                        console.log("window just loaded early scroll");
//                        if (document.getElementsByClassName("friendchat-chat-container-open")[0]) {
//                            document.getElementsByClassName("friendchat-chat-container-open")[0].scrollBy({
//                                top: 1000000000,
//                                behavior: "smooth"
//                            });
//                        }
//                    }
