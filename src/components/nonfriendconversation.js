import React, { Component } from 'react';
import minimize from'../static/minimize.svg'; import circlemenulight from '../static/circlemenulight.svg'; import heart from '../static/heart.svg'; import profile from '../static/profile.svg'; import chatblack from '../static/chat-black.svg'; import sendarrow from '../static/sendarrow.svg'; import close from '../static/close.svg';
import TextareaAutosize from 'react-textarea-autosize';

export default class NonFriendConversation extends Component { // non friend conversation nfc1
    constructor(props) {
        super(props);
        this.inputRef = React.createRef();
        this.scrollRef = React.createRef();
        this.userRef = React.createRef();
        this.state = { blockprompt: false, reportprompt: false, chatinput: false, chatlength: null

        }
    }

    componentDidMount() {
        if (this.props.conversation) {
            this.setState({ chatlength: this.props.conversation.log.length });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        let currentchatlength;
        let scrollChat = (i, speed) => { // Recursive scroll function, runs 3 times to definitively get length of scroll
            if (i != 0) {
                setTimeout(() => {
                    if (getHeight() > tempHeight) {
                        tempHeight = getHeight();
                        if (this) {
                            if (this.scrollRef) {
                                if (this.scrollRef.current) {
                                    this.scrollRef.current.scrollBy({
                                        top: getHeight(),
                                        behavior: "smooth"
                                    });
                                    i++; // If scroll ran, increment once
                                }
                            }
                        }
                    }
                    // console.log(i);
                    if (i>0) { i--; }
                    scrollChat(i, speed += 20); // Increase timeout time to ensure scroll
                }, speed);
            }
        }
        let getHeight = function() {
            if (document.getElementById('openotheruserchat')) {
                let height = document.getElementById('openotheruserchat').scrollHeight;
                return height;
            }
        }

        let tempHeight = getHeight();

        if (prevProps) {
            if (prevState.chatinput == false) { // If chat was just closed, scroll chat down now that it is open. Does not fire when chat is already open
                if (this.state.chatinput == true) {
                    if (this.scrollRef.current) { // Prevents crash when no friends
                        scrollChat(4, 10); // Run recursive scrollChat func
                    }
                }
            }

            if (this.props.conversation) {
                if (this.props.conversation.log) {
                    currentchatlength = this.props.conversation.log.length;
                }
            }

            if (currentchatlength) { // Autoscrolls on new chat
                if (this.state.chatlength == null) { // Chat length was null, set new
                    this.setState({ chatlength: currentchatlength });
                } else if (this.state.chatlength < currentchatlength) { // NEW CHAT, Chat length has been updated. Run scroll anim
                    this.setState({ chatlength: currentchatlength });
                    let newlogheight = 0;
                    newlogheight += this.scrollRef.current.getElementsByClassName('chat-log')[this.scrollRef.current.childElementCount-1].getBoundingClientRect().height;
                    if ((this.scrollRef.current.scrollHeight - this.scrollRef.current.scrollTop - newlogheight) <= 480) { // the difference between total height of chat, distance from top and the height of the last chat log. If less than or equal to 480 than bring scroll down when chat updated
                        if (document.getElementsByClassName("otheruserchat-chat-container-open")[0]) {
                            if (document.getElementsByClassName("otheruserchat-chat-container-open")[0].scrollHeight) {
                                let height = document.getElementsByClassName("otheruserchat-chat-container-open")[0].scrollHeight;
                                document.getElementsByClassName("otheruserchat-chat-container-open")[0].scrollBy({
                                    top: height,
                                    behavior: "smooth"
                                });
                            }
                        }
                    }
                }
            }
        }

        if (prevState) { // Changes chat input from true to false. Demonstrating if chat is open or not. If there was a previous state
            if (!prevState.chatinput) { // If previous chat input was false
                if (this.props.otheruserchatopen == this.userRef.innerHTML) { // If this friend is the current open chat
                    if (this.state.chatinput == false) { // and if this chatinput is still false
                        this.setState({ chatinput: true }); // change to true
                    }
                }
            } else {
                if (this.props.otheruserchatopen !== this.userRef.innerHTML) {
                    if (this.state.chatinput == true) {
                        this.setState({ chatinput: false });
                    }
                }
            }
        }
    }

    promptblockuser = (e) => {
        this.setState({ blockprompt: true });
    }
    promptexitblockuser = (e) => {
        this.setState({ blockprompt: false });
    }

    openchatinput = (e, otheruser) => {
        // console.log(e.target.classList);
        let room;
        if (this.props.conversation) {
            room = this.props.conversation._id;
        }
        // If user clicks on profile, do not open chat submit
        if (e.target.classList.contains("minimize-icon")) {
            this.props.updateotheruserchatopen(e, null);
        } else {
            this.props.updateotheruserchatopen(e, otheruser, room);
        }
        if (e.target.classList.contains("searched-user-message")) { // When user clicks on message, scroll down chat
            this.scrollRef.current.scrollBy({
                top: this.scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }

    handleKeyPress = (e, otheruser) => {
        if(e.key === 'Enter'){
            e.preventDefault();
            let sendchat = (e) => {
                this.props.beginchat(e, otheruser, this.inputRef._ref.value, this.props.conversation._id), this.resetchat(e);
            }
            sendchat(e);
        }
    }

    resetchat = (e) => {
        this.inputRef._ref.value = ""; // Clear chat message
    }

    searchandbefriend = (e, otheruser) => { // Queries for user and automatically sends invite for friendship.
        document.getElementsByClassName("user-search")[0].value = otheruser; // Set otheruser value to search
        this.props.searchforminput(); // Run searchform css styling functions.
        let userelement;
        let getuserelement = () => {
            // Check to ensure that the searched username only matches the name of non friend to invite to be friends
            if (document.getElementsByClassName("searched-user-div")[0]) {
                for (let i = 0; i < document.getElementsByClassName("search-users-results-container")[0].firstElementChild.childElementCount; i++) { // For each user in search view
                    if (document.getElementsByClassName("searched-user-div")[i]) { // if iterated child search user div exists
                        let userelement = document.getElementsByClassName("searched-user-div")[i]; // Assign current div to element variable
                        if (userelement.getElementsByClassName("searched-user-username")[0].innerHTML == otheruser) { // if innerhtml of this elements username element == otheruser
                            return userelement; // confirm appropriate element
                        } else {
                            return false;
                        }
                    }
                }
            }
        }
        let fetchusers = new Promise((resolve, reject) => { // Promise to fetch new users
            resolve(this.props.fetchusers());
            document.getElementsByClassName("user-search")[0].scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"}); // Scroll up search into view
        });
        fetchusers.then((e) => {
            // Actual functionality to click and invite user to be friends
            let invReq = function() {
                let element = getuserelement();
                if (element) {
                    if (element.getElementsByClassName("searched-user-send-friend-request")[0]) {
                        element.getElementsByClassName("searched-user-send-friend-request")[0].click();
                        //console.log("click!");
                        return true;
                    }
                }
                return false;
            }

            let k = 0;
            let interval = setInterval(function() { // Run send invite method every x seconds until method has ran successfully and sent invite
                console.log(k+=1);
                let invDone = invReq(); // Check if invite ran successfully.
                let element = getuserelement();
                // If invite done or element invite to be friend option doesnt exist or if search user results container is not open
                if (invDone || (element && (!element.getElementsByClassName("search-user-send-friend-request")[0] || element.getElementsByClassName("spinner-search-holder-visible"))) || !document.getElementsByClassName("search-users-results-container-opened")[0]) {
                    clearInterval(interval);
                    console.log("interval clear: invite nonfriendcomponent");
                }
            }, 100);
        })
    }

    render() {
        // basic functionality, if pending add option to add friend, show if pending, block option, send messages, chat.
        let otheruser = "";
        if (this.props.conversation) {
            for (const [index, user] of this.props.conversation.users.entries()) { // Iterate between users to find out which one is not you, this is the user that is not your friend that this chat belongs to.
                if (user != this.props.username) { otheruser = user; }
            }
        }

        let pending = (e) => { // Determines if a friend request from this user is waiting
            for (let i = 0; i < this.props.pendingfriendrequests.length; i++) {
                if (this.props.pendingfriendrequests[i].username == otheruser) {
                    return true;
                }
            }
        }


        return (

            <div>
            {
                this.props.conversation ?
                    <div className="otheruser" onClick={!this.state.chatinput ? (e) => {this.openchatinput(e, otheruser)} : null }>
                        <div className='searched-user-username-container'>
                            <img className="otheruseravatar" src={require("../static/bobby.jpg")}></img>
                            <div ref={tag => (this.userRef = tag)} className="otherusername">{otheruser}</div>
                            <div className="min-menu">
                                <img className={this.state.chatinput ? "minimize-icon" : "minimize-icon invisible"} src={minimize} onClick={(e) => {this.openchatinput(e)}} alt="circlemenu"></img>
                                <div className="search-user-dropdown">
                                    <img className="circle-menu-icon" src={circlemenulight} alt="circlemenu"></img>
                                    <div className="dropdown-content searchdropdownfix prevent-open-toggle">
                                        <button className='dropdown-content-option prevent-open-toggle'>share profile</button>
                                        {
                                            this.props.pendingfriendrequests ? !pending() ?
                                                    <button className='dropdown-content-option prevent-open-toggle' onClick={e => {this.searchandbefriend(e, otheruser)}}>invite</button>
                                                    :
                                                    <div></div>
                                                : <div></div>
                                        }
                                        {
                                            this.state.blockprompt == false ? // Prompt functionality to block
                                                <button className='dropdown-content-option block-option-dropdown prevent-open-toggle' onClick={this.promptblockuser}>block</button>
                                                :
                                                <div className='prompt-spacing prompt-background prevent-open-toggle'>
                                                    <span className='opensans-thin prevent-open-toggle'>Sure you want to block <span className="otherusername-small prevent-open-toggle">{otheruser}</span>?</span>
                                                    <span className="prevent-open-toggle"><button className ="button-yes prevent-open-toggle" onClick={(e) => {this.props.revokefriendrequest(e, otheruser, false, "nonfriendslist")}}>Yes</button></span><span className="prevent-open-toggle"><button className ="button-no prevent-open-toggle" type="button" onClick={this.promptexitblockuser}>No</button></span>
                                                </div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                            {
                                this.props.pendingfriendrequests ? pending() ?
                                    <div className="request-and-block-container">
                                        <div className='searched-user-befriend prevent-open-toggle' onClick={(e) => {this.props.acceptfriendrequest(e, otheruser, true)}}>befriend<img className="searched-user-icon prevent-open-toggle" src={heart} alt="chat"></img></div><div className='searched-user-unfriend prevent-open-toggle' onClick={(e) => {this.props.revokefriendrequest(e, otheruser, false, "nonfriendslist")}}>ignore<img className="searched-user-icon-block prevent-open-toggle" src={close} alt="chat"></img></div>
                                        <div className='search-user-profile prevent-open-toggle'>profile<img className="searched-user-icon prevent-open-toggle" src={profile} alt="profile"></img></div>
                                        <div className='searched-user-message' onClick={(e) => {this.openchatinput(e, otheruser)}}>message<img className="searched-user-icon" src={chatblack} alt="chat"></img></div>
                                    </div>
                                : <div className="request-and-block-container request-and-block-nonfriend">
                                    <div className='search-user-profile'>profile<img className="searched-user-icon" src={profile} alt="profile"></img></div>
                                    <div className='searched-user-message' onClick={(e) => {this.openchatinput(e, otheruser)}}>message<img className="searched-user-icon" src={chatblack} alt="chat"></img></div>
                                </div> : <div></div>
                            }
                        <div className="otheruserchat otheruserchat-container">
                        <div ref={this.scrollRef} id={this.props.otheruserchatopen === otheruser ? 'openotheruserchat' : 'closedotheruserchat'} className={
                            !this.state.chatlength ? "otheruserchat-chat-container otheruserchat-chat-container-empty" // If length of chat is null
                            : this.props.otheruserchatopen == otheruser ? "otheruserchat-chat-container otheruserchat-chat-container-open"  // If otheruserchatopen == this current user
                            : "otheruserchat-chat-container otheruserchat-chat-container-closed"
                        }>
                        {
                            this.props.conversation.users.length == 2 ?
                                this.props.conversation.log.map((log, index) => {
                                    if (this.props.otheruserchatopen === otheruser) { // if the open other user chat is this chat
                                        if (log.author == this.props.username) { // if this log is your chat
                                            return (
                                                <div className='chat-log chat-log-user chat-log-open'>
                                                    <div className='author-of-chat author-of-chat-user'>{log.author}</div>
                                                    <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                        <div>{log.content}</div>
                                                    </div>
                                                </div>
                                            )
                                        } else { // log belongs to other user
                                            return (
                                                <div className='chat-log chat-log-other chat-log-open'>
                                                    <div className='author-of-chat author-of-chat-other'>{log.author}</div>
                                                    <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                        <div>{log.content}</div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                    } else { // if the open other user chat is not this chat
                                        if (log.author == this.props.username) {
                                            if (index == this.props.conversation.log.length-1) {
                                                return (
                                                    <div className='chat-log chat-log-user'>
                                                        <div className='author-of-chat author-of-chat-user'>{log.author}</div>
                                                        <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                            <div>{log.content}</div>
                                                        </div>
                                                    </div>
                                                )
                                            } else {
                                                return (
                                                    <div className='chat-log chat-log-user chat-log-closed'>
                                                        <div className='author-of-chat author-of-chat-user'>{log.author}</div>
                                                        <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                            <div>{log.content}</div>
                                                        </div>
                                                    </div>
                                                )
                                            }

                                        } else {
                                            if (index == this.props.conversation.log.length-1) {
                                                return (
                                                    <div className='chat-log chat-log-other'>
                                                        <div className='author-of-chat author-of-chat-other'>{log.author}</div>
                                                        <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                            <div>{log.content}</div>
                                                        </div>
                                                    </div>
                                                )
                                            } else {
                                                return (
                                                    <div className='chat-log chat-log-other chat-log-closed'>
                                                        <div className='author-of-chat author-of-chat-other'>{log.author}</div>
                                                        <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                            <div>{log.content}</div>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        }
                                    }
                                })
                            :
                            <div></div>
                        }
                        </div>
                    </div>
                    <form className={ this.props.otheruserchatopen == otheruser ? "friend-chat-form friend-chat-form-closed friend-chat-form-open"
                                    : "friend-chat-form friend-chat-form-closed"}
                        >
                        <span>
                        <TextareaAutosize className ={this.props.otheruserchatopen == otheruser ? "textarea-chat-autosize fixfocuscolor"
                                                     : "textarea-chat-autosize fixfocuscolor textarea-chat-autosize-closed"}
                        ref={tag => (this.inputRef = tag)} onKeyPress={(e) => {this.handleKeyPress(e, otheruser)}} />
                        <button className={this.props.otheruserchatopen == otheruser ? "friend-chat-submit friend-chat-submit-open"
                                          : "friend-chat-submit"}
                        onClick={(e) => {this.props.beginchat(e, otheruser, this.inputRef._ref.value, this.props.conversation._id), this.resetchat(e)}} type='submit' value='submit'><img className="sendarrow-icon" src={sendarrow} alt="sendarrow"></img></button>
                        </span>
                    </form>
                </div>

                :
                <div></div>
            }
            <div>
                <div className='content-divider-thin'>&nbsp;</div>
            </div>
            </div>
        )
    }
}
