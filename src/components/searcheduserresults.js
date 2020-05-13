import React, { Component } from 'react';
import angleDoubleLeft from '../static/angle-double-left-solid.svg'; import circlemenulight from '../static/circlemenulight.svg'; import profile from '../static/profile.svg'; import play from '../static/play.svg'; import pointingfinger from '../static/pointingfinger.svg'; import subscribe from '../static/subscribe.svg'; import heart from '../static/heart.svg';
import TextareaAutosize from 'react-textarea-autosize'; import sendarrow from '../static/sendarrow.svg'; import chatblack from '../static/chat-black.svg';

export default class SearchedUserResults extends Component { // search user component sup1
    constructor(props) {
        super(props);
        this.searchChatFormRef = React.createRef();
        this.searchChatSubmitRef = React.createRef();
        this.inputRef = React.createRef();
        this.spinnerRef = React.createRef();
        this.state = { removeprompt: false,
            blockprompt: false,
            reportprompt: false,
            waitingfetch: false }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps != this.props) {
            this.unsetSpinner();
        }
    }

    promptremovefriend = (e) => {
        this.setState({ removeprompt: true });
        console.log('remove friend prompt');
    }
    promptexitremovefriend = (e) => {
        this.setState({ removeprompt: false });
    }
    promptblockuser = (e) => {
        this.setState({ blockprompt: true });
    }
    promptexitblockuser = (e) => {
        this.setState({ blockprompt: false });
    }

    openchatinput = (e) => {
        // console.log(this.props.index);
        console.log(this.props.searchtotal);
        for (let i = 0; i < this.props.searchtotal; i++) { // Check other chatforms and remove
            if (document.getElementsByClassName('search-chat-form')[i]) {
                document.getElementsByClassName('search-chat-form')[i].classList.remove('search-chat-form-open');
                document.getElementsByClassName('search-textarea-chat-autosize')[i].classList.add('search-textarea-chat-autosize-closed');
                document.getElementsByClassName('search-chat-submit')[i].classList.remove('search-chat-submit-open');
            }
        }
        this.searchChatFormRef.classList.add('search-chat-form-open'); // open chat form
        this.inputRef._ref.classList.remove('search-textarea-chat-autosize-closed');
        this.searchChatSubmitRef.classList.add('search-chat-submit-open');
    }

    handleKeyPress = (e, otheruser) => {
        if(e.key === 'Enter'){
            e.preventDefault();
            let sendchat = (e) => {
                this.props.beginchat(e, otheruser, this.inputRef._ref.value, null, true), this.resetchat(e);
                this.inputRef._ref.placeholder = "message was sent";
            }
            sendchat(e);
        }
    }

    setSpinner = (e) => {
        this.spinnerRef.current.classList.add("spinner-search-holder-visible");
        this.setState({ waitingfetch: true });
    }

    unsetSpinner = (e) => {
        if (this.state.waitingfetch == true) {
            this.setState({ waitingfetch: false });
            this.spinnerRef.current.classList.remove("spinner-search-holder-visible");
        }
    }

    resetchat = (e) => {
        this.inputRef._ref.value = ""; // Clear chat message
    }


    render() {
        return (
            this.props.yourself() ?
            <div className='searched-user-div'>
                <div className='searched-user-username-container'>
                    <img className="searched-user-avatar" src={require("../static/bobby.jpg")}></img>
                    <div className='searched-user-username'>{this.props.searcheduser}</div>
                    <div className="search-chat-form"></div>
                    <div className="search-textarea-chat-autosize"></div>
                    <div className="search-chat-submit"></div>
                </div>
            </div>
            :
            <div className="search-users-relative-div">
                <div ref={this.spinnerRef} className="spinner-search-holder">
                    <div className="loadingio-spinner-dual-ball loadingio-spinner-dual-ball-m6fvn6j93c"><div className="ldio-oo3b7d4nmnr">
                    <div></div><div></div><div></div>
                    </div></div>
                    <div className="cover-search"></div>
                </div>
                <div className='searched-user-div'>
                    <div className='searched-user-username-container'>
                        <img className="searched-user-avatar" src={require("../static/bobby.jpg")}></img>
                        <div className='searched-user-username'>{this.props.searcheduser}</div>
                        <div className='search-user-dropdown search-user-dropdown-search'>
                            <img className="circle-menu-icon" src={circlemenulight} alt="circlemenu"></img>
                            <div className="dropdown-content dropdown-content-search searchdropdownfix">
                                <button className='dropdown-content-option'>share profile</button>
                                <button className='dropdown-content-option'>watch</button>
                                <div className='dropdown-content-divider'>&nbsp;</div>
                                {
                                    this.props.alreadyfriends() ? // Redundant unfriend option, default location is in friends component. Shows in both
                                            this.state.removeprompt == false ? // Prompt functionality to ask to unfriend
                                                <button type="button" className='dropdown-content-option' onClick={this.promptremovefriend}>unfriend</button>
                                                :
                                                <div className='prompt-spacing prompt-background'>
                                                    <span className='opensans-thin'>Sure you want to unfriend <span className="friendname-small">{this.props.searcheduser}</span>?</span>
                                                    <div className='prompt-yesno-spacing'><span><button className ="button-yes" onClick={(e) => {this.props.revokefriendrequest(e, this.props.searcheduser); this.promptexitremovefriend()}}>Yes</button></span><span><button className ="button-no" type="button" onClick={this.promptexitremovefriend}>No</button></span></div>
                                                </div>
                                        :
                                        <div></div>
                                }
                                {
                                    this.state.blockprompt == false ? // Prompt functionality to block
                                        <button className='dropdown-content-option block-option-dropdown' onClick={this.promptblockuser}>block</button>
                                        :
                                        <div className='prompt-spacing prompt-background'>
                                            <span className='opensans-thin'>Sure you want to block <span className="friendname-small">{this.props.searcheduser}</span>?</span>
                                            <span><button className ="button-yes" onClick={(e) => {this.props.revokefriendrequest(e, this.props.searcheduser); this.promptexitblockuser()}}>Yes</button></span><span><button className="button-no" type="button" onClick={this.promptexitblockuser}>No</button></span>
                                        </div>
                                }
                                <button className='dropdown-content-option report-option-dropdown'>report</button>
                            </div>
                        </div>

                    </div>
                    <div className='request-and-block-container'>
                        <span className='search-user-profile'>profile<img className="searched-user-icon" src={profile} alt="profile"></img></span>
                        {
                            this.props.alreadyfriends() ?
                                <span className='search-profile-bump-container'><span className='search-user-watch'>watch<img className="searched-user-icon" src={play} alt="play"></img></span><span className='search-user-bump'>bump<img className="searched-user-icon" src={pointingfinger} alt="pointingfinger"></img></span></span>
                                : this.props.requestwaiting() ?
                                    <span className='search-profile-bump-container'>
                                        <div className='searched-user-follow-request'>follow<img className="searched-user-icon" src={subscribe} alt="subscribe"></img></div>
                                        <div className='search-user-accept-friend-request' onClick={(e) => {this.props.acceptfriendrequest(e, this.props.searcheduser, true); this.setSpinner();}}>accept<img className="searched-user-icon" src={heart} alt="heart"></img></div>
                                    </span>
                                    : this.props.alreadypending() ?
                                        <span className='search-profile-bump-container'>
                                            <div className='searched-user-follow-request'>follow<img className="searched-user-icon" src={subscribe} alt="subscribe"></img></div>
                                            <div className='search-user-pending-friend-request' onClick={(e) => {this.props.revokefriendrequest(e, this.props.searcheduser, true); this.setSpinner();}}>pending</div>
                                        </span>
                                        :
                                        <span className='search-profile-bump-container'>
                                            <div className='searched-user-follow-request'>follow<img className="searched-user-icon" src={subscribe} alt="subscribe"></img></div>
                                            <div className='searched-user-send-friend-request' onClick={(e) => {this.props.sendfriendrequest(e, this.props.searcheduser); this.setSpinner();}}>invite<img className="searched-user-icon" src={heart} alt="friend request"></img></div>
                                        </span>
                        }
                        <div className='searched-user-message' onClick={this.openchatinput}>message<img className="searched-user-icon" src={chatblack} alt="chat"></img></div>
                    </div>
                    <form className='search-chat-form search-chat-form-closed' method="PUT" action="/chat" ref={tag => (this.searchChatFormRef = tag)}>
                        <span>
                        <TextareaAutosize className='search-textarea-chat-autosize search-textarea-chat-autosize-closed' ref={tag => (this.inputRef = tag)} onKeyPress={(e) => {this.handleKeyPress(e, this.props.searcheduser)}} />
                        <button className='search-chat-submit' onClick={(e) => {this.props.beginchat(e, this.props.searcheduser, this.inputRef._ref.value, null, true), this.resetchat(e)}} type='submit' value='submit' ref={tag => (this.searchChatSubmitRef = tag)}><img className="sendarrow-icon" src={sendarrow} alt="sendarrow"></img></button>
                        </span>
                    </form>
                </div>
            </div>
        )
    }
}
