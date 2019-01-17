'use strict';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Player } from 'video-react';
import {
    BrowserRouter,
    Route,
    NavLink
} from 'react-router-dom';
import { instanceOf } from 'prop-types';
import Cookies from 'universal-cookie';
import logo from './static/minireel-dot-com-3.svg'; import mango from './static/minireel-mangologo.svg'; import heart from './static/heart.svg'; import whiteheart from './static/heart-white.svg'; import history from './static/history.svg'; import search from './static/search-white.svg'; import notifications from './static/notifications.svg'; import profile from './static/profile.svg'; import upload from './static/upload.svg'; import thumbsup from './static/thumbsup.svg'; import thumbsdown from './static/thumbsdown.svg'; import share from './static/share.svg'; import sidebarcloseimg from './static/sidebarclose.svg';  import sidebaropenimg from './static/sidebaropen.svg'; import dummythumbnail from './static/warrenbuffetthumb.jpg'; import chatblack from './static/chat-black.svg'; import close from './static/close.svg'; import hamburger from './static/hamburger.svg'; import pointingfinger from './static/pointingfinger.svg'; import circlemenu from './static/circlemenu.svg'; import newspaperblack from './static/newspaper.svg'; import play from './static/play.svg'; import television from './static/tv.svg'; import subscribe from './static/subscribe.svg';
import './App.css';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import './videoplayer.css';
import $ from 'jquery';

import AwesomeDebouncePromise from 'awesome-debounce-promise';

import videofeedvar from './videofeedplaceholder';
import aconversationbetweenfriendsvar from './conversationbetweenfriendsplaceholder';

const reEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const rePass = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,56}$/;
const reUsername = /^[a-z0-9.]{5,22}$/;

const cookies = new Cookies();

let devurl = 'http://localhost:3000/';
let productionurl = 'https://www.minireel.org/';
let currentrooturl =  devurl;

// test friend array. Array will come from json request from mongodb.
let friends = [
    {
        username: 'ricardo.benson',
        status: 'online',
        emitting: true,
        watching: 'Space X Falcon 9 launches TESS & Falcon 9 first stage landing',
        watchingurl: 'www.yahoo.ca',
    },
    {
        username: 'carla.tisci',
        status: 'offline',
        emitting: true,
        watching: 'Charlie Rose interviews David Foster Wallace, clip 2/4 series',
        watchingurl: 'www.yahoo.ca',
    },
    {
        username: 'allessandrooo',
        status: 'online',
        emitting: false,
        watching: 'Man in Corvette loses police on chase in Daytona Beach',
        watchingurl: 'www.yahoo.ca',
    },
    {
        username: 'yupyuppp',
        status: 'online',
        emitting: true,
        watching: 'Space X Falcon 9 launches TESS & Falcon 9 first stage landing',
        watchingurl: 'www.yahoo.ca',
    }
];

// placeholder import chat

let aconversationbetweenfriends = aconversationbetweenfriendsvar;
    
// placeholder import video info
let videofeed = videofeedvar;

// Search bar componenet
class SearchForm extends Component {
    render() {
        let getInnerSearchText = 'Search film..';
        
        return (
        <form className="search-form-flex" method="GET" action="/search">
                            <input className="search-field" id="search" type="search" placeholder={getInnerSearchText} name="search"></input>
                            <button className="searchbox" type="submit" value="submit">
                                <img className="search" src={search} alt="search"></img>
                            </button>
                        </form>
        );
    }
};

// Nav bar with appropriate links to likes, history, minireel home, search film bar, notifications, friends & upload.

function Navbar(props) {
    return (
        <nav className="navbar navbar-default border-navigation">
            <row className="nowrap">
                <ul className="nav flex-grow2 nowrapbuttons">
                    <a href="favorites"><img className="favorites" src={heart} alt="favorites"></img></a>
                    <a href='history'><img className="history" src={history} alt="history"></img></a>
                </ul>
                <div className="brand flex-grow1">
                    <NavLink exact to="/"><img className="minireel-nav d-inline" src={logo} alt="minireel"></img></NavLink>
                    <SearchForm />
                </div>
                <ul className="nav flex-grow2 flex-end nowrapbuttons">
                    <a href="/notifications"><img className="notifications" src={notifications} alt="notifications"></img></a>
                    <a href="/profile"><img className="profile" src={profile} alt="profile"></img></a>
                    <a href="/upload"><img className="upload" src={upload} alt="upload"></img></a>
                </ul>
            </row>
        </nav>
    )
}

// Login & register if { user: logged out }
class Login extends Component {
    constructor(props) {
        super(props);
        this.state = { welcome: 'Welcome to minireel', message: 'Watch videos with friends Speak your mind Enjoy original content'}
    }
    
    submitLogin = (e) => { 
        function emailvalidation(email) {
            let emailworks = false;
            //check for proper email
            if (reEmail.test(email) === true) {
                emailworks = true;
            } else {
                emailworks = false;
            }
            return emailworks;
        }

        function passwordvalidation(password) {
            let passwordworks = false;
            //check for password over 8 character and less than 56. a-z, A-Z, One uppercase, one number.
            if(rePass.test(password) === true) {
               passwordworks = true;
            } else {
               passwordworks = false;
            }    
            return passwordworks;
        }

        let email = this.refs.email.value;
        let password = this.refs.pass.value;
        let goodemail = emailvalidation(email);
        let goodpass = passwordvalidation(password);

        if (!goodemail) {
            e.preventDefault();
            (document.getElementsByClassName('faulty-email')[0]).style.display = 'block';
        } else {
            (document.getElementsByClassName('faulty-email')[0]).style.display = 'none';
        }

        if (!goodpass) {
            e.preventDefault();
            (document.getElementsByClassName('faulty-pass')[0]).style.display = 'block';
        } else {
            (document.getElementsByClassName('faulty-pass')[0]).style.display = 'none';
        }
    }
    
    submitRegister = (e) => {
                
        function emailvalidation(email) {
            let emailworks = false;
            //check for proper email
            if (reEmail.test(email) === true) {
                emailworks = true;
            } else {
                emailworks = false;
            }
            return emailworks;
        }
        
        function usernamevalidation(username) {
            let usernameworks = false;
            //check for proper username
            if(reUsername.test(username) === true) {
               usernameworks = true;
            } else {
               usernameworks = false;
            }    
            return usernameworks;
        }
        
        function passwordvalidation(password) {
            let passwordworks = false;
            //check for password over 8 character and less than 56. a-z, A-Z, One uppercase, one number.
            if(rePass.test(password) === true) {
               passwordworks = true;
            } else {
               passwordworks = false;
            }    
            return passwordworks;
        }
        
        function passwordconfirm(password, confirmpassword) {
            let passwordequality = false;
            //check if passwords are the same
            if(password === confirmpassword) {
                passwordequality = true;
            } else {
                passwordequality = false;
            }
            return passwordequality;
        }
        
        let username = this.refs.username.value;
        let email = this.refs.regemail.value;
        let password = this.refs.regpw.value;
        let confirmpassword = this.refs.regpw2.value;
        let gooduser = usernamevalidation(username);
        let goodemail = emailvalidation(email);
        let goodpassreg = passwordvalidation(password);
        let goodpassconfirm = passwordconfirm(password, confirmpassword);
                
        if (!gooduser) {
            e.preventDefault();
            (document.getElementsByClassName('faulty-username')[0]).style.display = 'block';
        } else {
            (document.getElementsByClassName('faulty-username')[0]).style.display = 'none';
        }
        
        if (!goodemail) {
            e.preventDefault();
            (document.getElementsByClassName('faulty-email-register')[0]).style.display = 'block';
        } else {
            (document.getElementsByClassName('faulty-email-register')[0]).style.display = 'none';
        }
        
        if (!goodpassreg) {
            e.preventDefault();
            (document.getElementsByClassName('faulty-pass-register')[0]).style.display = 'block';
        } else {
            (document.getElementsByClassName('faulty-pass-register')[0]).style.display = 'none';
        }
        
        if (!goodpassconfirm) {
            e.preventDefault();
            (document.getElementsByClassName('faulty-confirmpass-register')[0]).style.display = 'block';
        } else {
            (document.getElementsByClassName('faulty-confirmpass-register')[0]).style.display = 'none';
        }
    }
    
    render() {
        return (
            <div>
                <div className="minireel-logo-center">
                    <img className="minireel-register-logo" src={mango} alt="Minireel"></img>
                    <p className="register-text">{this.state.welcome}</p>
                    <p className="register-text">Watch videos with friends<br></br>Speak your mind<br></br>Enjoy original content</p>
                </div>
                <form className="loginform" refs='loginform' method="POST" action="/users/login" novalidate="novalidate">
                    <div className="form-group">
                        <label for="email">email</label>
                        <input className="form-control" ref='email' id="email" type="email" name="email"></input>
                        <div id='loginerrorcontainer'><div className='form-error faulty-email' style={{display: 'none'}}>please enter a valid email</div></div>
                    </div>
                    <div className="form-group">
                        <label for="pw">password</label>
                        <input className="form-control" ref='pass' id="pw" type="password" name="password"></input>
                        <div id='passerrorcontainer'><div className='form-error faulty-pass' style={{display: 'none'}}>password must be between 8-56 characters, have 1 uppercase, 1 lowercase and a number</div></div>
                    </div>
                    <button className="btn btn-primary" type="submit" onClick={this.submitLogin}>login</button>
                </form>
                <form className="registerform" method="POST" action="/users/register" novalidate="novalidate">
                    <div className="form-group">
                        <label for="username">username</label>
                        <input className="form-control" ref='username' id="username" type="text" name="username"></input>
                        <div id='registerusernameerrorcontainer'><div className='form-error faulty-username' style={{display: 'none'}}>username must be between 5 and 22 characters. may contain periods</div></div>
                    </div>
                    <div className="form-group">
                        <label for="regemail">email</label>
                        <input className="form-control" ref='regemail' id="regemail" type="email" name="regemail"></input>
                        <div id='registeremailerrorcontainer'><div className='form-error faulty-email-register' style={{display: 'none'}}>please enter a valid email</div></div>
                    </div>
                    <div className="form-group">
                        <label for="regpw">password</label>
                        <input className="form-control" ref='regpw' id="regpw" type="password" name="regpassword"></input>
                        <div id='registerpwerrorcontainer'><div className='form-error faulty-pass-register' style={{display: 'none'}}>password must be between 8-56 characters, have 1 uppercase, 1 lowercase and a number</div></div>
                    </div>
                    <div className="form-group">
                        <label for="regpw2">confirm password</label>
                        <input className="form-control" ref='regpw2' id="regpw2" type="password" name="confirmPassword"></input>
                        <div id='registerconfirmpwerrorcontainer'><div className='form-error faulty-confirmpass-register' style={{display: 'none'}}>passwords are not the same</div></div>
                    </div>
                    <button className="btn btn-primary" type="submit" onClick={this.submitRegister}>sign up</button>
                </form>
            </div>
        );
    };
};

// render entire log of conversation with friend 

function ChatLog(props) {
    
    return (
        <div className='chat-log'>
            <div className='author-of-chat'>{props.author}</div>
            <div className='content-of-chat'>{props.content}</div>
        </div>
    )
}

// output friend
// if prop is defined then output quick chats, else do not.
// {props.conversations[props.index].log.slice(-1)[0].content}
// make load entire conversation log for now, but slice at 50 messages.
function Request(props) {
    return (
        <div className='user-request-container'>
            <div className='user-request-div'>{props.userrequest}</div>
            <div className='user-request-actions'>
                <div className='user-request-befriend'>Befriend<img className="searched-user-icon" src={whiteheart} alt="friend request"></img></div>
                <div className='user-request-profile'>profile<img className="searched-user-icon" src={profile} alt="chat"></img></div>
                <div className='user-request-message'>message<img className="searched-user-icon" src={chatblack} alt="chat"></img></div>
                <div className='user-request-block'>block <img className="searched-user-icon-block" src={close} alt="chat"></img></div>
            </div>
        </div>
    )
}

function SearchedUserResults(props) {
    
    // if request is waiting, allow accept through search.
    // if request already sent, allow revoke.
    // else show request friendship button.
    return (
        props.yourself() ?
        <div></div>
        :
        <div className='searched-user-div'>
            <div className='searched-user-username-container'>
                <img className="searched-user-avatar" src={require("./static/bobby.jpg")}></img>
                <div className='searched-user-username'>{props.searcheduser}</div>
                <div className='search-user-dropdown'>
                    <img className="circle-menu-icon" src={circlemenu} alt="circlemenu"></img>
                    <div className="dropdown-content">
                        <div className='dropdown-content-option'>share profile</div>
                        <div className='dropdown-content-option'>watch</div>
                        <div className='dropdown-content-divider'>&nbsp;</div>
                        {
                            props.alreadyfriends() ?
                                <div className='dropdown-content-option'>unfriend</div>
                                :
                                <div></div>
                        }
                        <div className='dropdown-content-option block-option-dropdown'>block</div>
                        <div className='dropdown-content-option report-option-dropdown'>report</div>
                    </div>
                </div>
            </div>
            <div className='request-and-block-container'>
                <span className='search-user-profile'>profile<img className="searched-user-icon" src={profile} alt="profile"></img></span> 
                {
                    props.alreadyfriends() ?
                        <span className='search-profile-bump-container'><span className='search-user-watch'>watch<img className="searched-user-icon" src={play} alt="play"></img></span><span className='search-user-bump'>bump<img className="searched-user-icon" src={pointingfinger} alt="pointingfinger"></img></span></span>
                        :
                        props.requestwaiting() ?
                            <span className='search-profile-bump-container'> 
                                <div className='searched-user-follow-request'>follow<img className="searched-user-icon" src={subscribe} alt="subscribe"></img></div>
                                <div className='search-user-accept-friend-request'onClick={props.acceptfriendrequest}>Accept ?</div> 
                            </span>
                            :
                            props.alreadypending() ?
                                <span className='search-profile-bump-container'> 
                                    <div className='searched-user-follow-request'>follow<img className="searched-user-icon" src={subscribe} alt="subscribe"></img></div>
                                    <div className='search-user-pending-friend-request'onClick={props.revokefriendrequest}>pending</div> 
                                </span>
                                :
                                <span className='search-profile-bump-container'> 
                                    <div className='searched-user-follow-request'>follow<img className="searched-user-icon" src={subscribe} alt="subscribe"></img></div>
                                    <div className='searched-user-send-friend-request' onClick={props.sendfriendrequest}>invite<img className="searched-user-icon" src={heart} alt="friend request"></img></div>
                                </span> 
                }
                <div className='searched-user-message' onClick={props.beginchat}>message<img className="searched-user-icon" src={chatblack} alt="chat"></img></div>
            </div>
        </div>
    )
}  

function Friends(props) {
        
    return (
        <div className="friend">
            <div className='searched-user-username-container'>
                <img className="friendavatar" src={require("./static/bobby.jpg")}></img>
                <div className="friendname">{props.username}</div>
                <div className='search-user-dropdown'>
                        <img className="circle-menu-icon" src={circlemenu} alt="circlemenu"></img>
                        <div className="dropdown-content">
                            <div className='dropdown-content-option'>share profile</div>
                            <div className='dropdown-content-option'>watch</div>
                            <div className='dropdown-content-divider'>&nbsp;</div>
                            <div className='dropdown-content-option'>unfriend</div>
                            <div className='dropdown-content-option block-option-dropdown'>block</div>
                            <div className='dropdown-content-option report-option-dropdown'>report</div>
                        </div>
                    </div>
            </div>
            { 
                props.watching ?
                    <span className="iswatchingtitle"> is watching <strong>{props.watching}</strong></span>
                    :
                    <span></span>
            }
            <div className='request-and-block-container'>
                <span className='search-user-profile'>profile<img className="searched-user-icon" src={profile} alt="profile"></img></span> 
                <span className='search-user-watch-friend'>watch<img className="searched-user-icon" src={play} alt="play"></img></span>
                <span className='search-user-bump-friend'>bump<img className="searched-user-icon" src={pointingfinger} alt="pointingfinger"></img></span>
                <div className='searched-user-message' onClick={props.beginchat}>message<img className="searched-user-icon" src={chatblack} alt="chat"></img></div>
            </div>
            <div className="friendchat friendchat-container">
                <div className="friendchat-chat-container friendchat-chat-container-closed" onClick={props.togglechat}>
                    {
                        props.conversations[props.index] ?
                            props.conversations[props.index].log[0] ?
                                <div>{props.conversations[props.index].log.map(function(log, index) {
                                    let authorprop = props.conversations[props.index].log[index].author;
                                    let contentprop = props.conversations[props.index].log[index].content; 

                                    return (
                                        <ChatLog author = {authorprop}
                                        content = {contentprop}
                                        key={index}
                                        />
                                     )
                                })}</div>
                
                        :<div></div>
                    :<div></div>
                    }
                </div>
            </div>
                
            <form className='friend-chat-form friend-chat-form-closed' method="PUT" action="/chat">
                <input className='friend-chat-input' id="chat" type='chat' placeholder="..." name='chat'></input>
                <button className='friend-chat-submit' type='submit' value='submit'><span>send</span></button>
            </form>
        </div>
    )
}

function Social(props) {
    return (
        <div>
            <div className="userquickdash row">
                <div className="usernamedash">{props.username}</div>
                <div>
                    <div className="logout"><a href="/users/logout" onClick={props.fetchlogout}>logout</a><img className="minimize-dash" src={hamburger} alt="hamburger" onClick={props.toggleSideBar}></img></div>
                </div>
            </div>
            <div className="friend-requests-view">
                <button className="friends-view">friends</button>
                <button className="requests-view" onClick={props.getpendingrequests}>requests</button>
            </div>
            <div className='friend-requests-list'>
                <div>
                    {props.pendingfriendrequests.map(function(request, index) {

                        return (
                            <Request
                            userrequest={request.username}
                            key={index}
                            index={index}
                            />
                        )
                    })}
                </div>
            </div>
            <div>
                <form className="search-form-flex" onInput={props.fetchusers} onSubmit={props.fetchuserpreventsubmit} noValidate='noValidate' autoComplete='off'>
                    <input className="user-search" id="usersearch" type="search" placeholder="Search users..." name="usersearch"></input>
                </form>
            </div>
            <div className='search-users-results-container'>
                <div> 
                    {
                    props.searchusers[0] ?                         
                        props.searchusers[0].map(function(searcheduser, index) {
                            
                            // determine if searched user is on pending list
                            let alreadypending = function() {
                                    for (var i = 0; i < searcheduser.friends.length; i++) {
                                    let t;
                                    if (searcheduser.friends[1].pending[i]) {
                                    t = searcheduser.friends[1].pending[i].username;
                                    }
                                    if (t === props.username) {
                                        console.log(searcheduser.username + ' currently being searched');
                                        console.log(props.username + ' on pending list!');
                                        return true;
                                    }
                                }
                            }

                            let requestwaiting = function() {
                                for (var i = 0; i < props.searchusers[1].length; i++) {
                                    if (props.searchusers[1]) {
//                                        console.log(props.searchusers[1][i].username + ' and ' + searcheduser.username);
                                        if(props.searchusers[1][i].username === searcheduser.username) {
                                            return true;
                                        }       
                                    }
                                }
                            }
                            
                            // function to determine if already friends
                            let alreadyfriends = function() {
                                for (var i = 0; i < props.friends.length; i++) {
                                    if (props.friends[0]) {
//                                        console.log(props.friends[i].username + ' and ' + searcheduser.username);
                                        if(props.friends[i].username === searcheduser.username) {
                                            return true;
                                        }       
                                    }
                                }
                            }
                            // function to determine if searched user is self
                            let yourself = function() {
                                for (var i = 0; i < props.friends.length; i++) {
                                    if (props.friends[0]) {
                                        if(props.username === searcheduser.username) {
                                            return true;
                                        }       
                                    }
                                }
                            }
                            
                            return ( 
                                <SearchedUserResults searcheduser={searcheduser.username}
                                key={index} sendfriendrequest={props.sendfriendrequest} acceptfriendrequest={props.acceptfriendrequest} revokefriendrequest={props.revokefriendrequest} alreadypending={alreadypending} requestwaiting={requestwaiting} alreadyfriends={alreadyfriends} yourself={yourself} beginchat={props.beginchat}
                                />
                            )

                        })
                    : <div></div>
                    } 
                </div>
            </div>
            <div className='friendchatcontainer' refs='friendchatcontainer'>
                {/* Append friends from social bar state (props.friends). For each friend return appropriate object info to build Friends div using Friends(props) function above. */}
                {props.friends.map(function(friend, index) {
                    // Shortens length of video title if length of string is over 48.
//                    if (friend.watching) {
//                        let friendWatching = function friendWatchingLengthSubstring() {
//                            if (friend.watching.length > 57) {
//                                let friendWatching = friend.watching.substring(0, 54) + '...';
//                                return friendWatching;
//                            } else {
//                                friendWatching = friend.watching;
//                                return friendWatching;
//                            }
//                        }
//                    };

                    return (
                        <Friends username={friend.username}
                        key={index}
                        index={index}
                        togglechat={props.togglechat}
                        conversations={props.conversations}
                        beginchat={props.beginchat}
                        />
                    )
                })}
            </div>
        </div>
    )
}

// Video Dash PAGE
// Request to Api algorithm to append relevant videos. 
// For now build map function that appends VIDEO object array with appropriate
// video.title, video.thumbnail, video.author, video.length, video.url


function Videos(props) {
    return (
        <div className="col">
            <div className='videocontainer'>
                <p className='mainvideotitle'>{props.title}</p>
                <NavLink to='/watch/'><img className='videothumb' src={dummythumbnail}></img></NavLink>
                <p className='videodesc'>{props.description}</p>
            </div>
        </div>
    )
}

function Video(props) {
     // TODO integrate videojs
    return (
        <div id='videocontainer'>
          <Player
              playsInline
              poster="/assets/poster.png"
              src="//vjs.zencdn.net/v/oceans.mp4"
            />
            <h2 className='watchpage-title'>Space X Falcon 9 launches TESS & Falcon 9 first stage landing</h2>
            <div className='publisher-bar'>
                <div className='publisher-info'>
                    <img className="publisher-avatar" src={require("./static/spacexavatar.jpg")}></img>
                    <span className='publisher-userandjoindate'>
                        <span>
                            <span className='publisher-username'>Space X</span>
                            <span className='publisher-followbutton'>follow</span>
                        </span>

                    </span>
                </div>
                
                <div className='publisher-video-interact'>
                    <img className="favorites-interact" src={heart} alt="favorites"></img>
                    <div className='publisher-video-interact-block'>
                        <img className="thumbsup-interact" src={thumbsup} alt="thumbsup"></img>
                        <span>432K</span>
                    </div>
                    <div className='publisher-video-interact-block'>
                        <img className="thumbsdown-interact" src={thumbsdown} alt="thumbsdown"></img>
                        <span>12K</span>
                    </div>
                    <img className="share-interact" src={share} alt="share"></img>
                    <div className='video-interact-border'></div>
                    <span>32,392,329 views</span>
                    <div className='more-options-ellipsis'>...</div>
                </div>
            </div>
            <div className='video-description-info'>
                Following its first test launch, Falcon Heavy is now the most powerful operational rocket in the world by a factor of two. With the ability to lift into orbit nearly 64 metric tons (141,000 lb)---a mass greater than a 737 jetliner loaded with passengers, crew, luggage and fuel--Falcon Heavy can lift more than twice the payload of the next closest operational vehicle, the Delta IV Heavy, at one-third the cost. Falcon Heavy draws upon the proven heritage and reliability of Falcon 9. 

                #falcon9 #spacex #earth #iridium #satellite #weregoingtospace #tesla #flyingtesla
            </div>
            <div className='video-description-upload-date'>uploaded <span className='upload-date-append'>april 23, 2008</span> at <span class='upload-time-append'>3:20pm eastern</span></div>
        </div>
        
    )
}

// Appends videos to dash
// TODO 
// Description shortener function
// publisher
// publish date.
// begin backend mongodb API and HDFS FS.

function Dash(props) {  
        
    return (        
        <div className='videodash'>
            <div className='flex-grid videogrid'>
                {props.mainfeed.map(function(video, index) {
                    return (
                        <Videos title={props.mainfeed[index].title}
                        description={props.mainfeed[index].description}
                        publisher={props.mainfeed[index].publisher}
                        publish={props.mainfeed[index].publish}
                        key={[index]}
                        />
                    )
                })}
            </div>
        </div>
    )
}

// Friends. Use array for now. Socket io. Add friend state to interact with backend api and update following info of friends (user in this case being that friend)
// user.status
// user.watching
// user.watching.url === video.url
// me.chats.host.user.log.mostrecent
// user.url

// Side Social Bar

class Socialbar extends Component {
    constructor(props) {
        super(props);
        
        this.state = { isLoggedIn: (cookies.get('loggedIn')), 
                      sidebarximgSrc: sidebarcloseimg, 
                      sidebarStatus: 'open', 
                      username: cookies.get('loggedIn'),
                      friends: friends,
                      users: {},
                      conversations: [],
                      searchuserinput: '',
                      searchusers: [],
                      pendingfriendrequests: [],
                     }
        
        this.getpendingrequests = this.getpendingrequests.bind(this);
        this.debouncefetchusers = this.debouncefetchusers.bind(this);
    }
    
    // function to run when mongodb gets information that state has changed.
    // test if the current state is equal to new object array.
    // then do something.
    appendFriends() {
        
    }
    
    componentWillMount() {
    }
    
    componentDidMount() {
       if (this.state.sidebarStatus === 'open') {
           document.getElementsByClassName('maindash')[0].classList.add('maindashwide');
           this.openSideBar();
       } else {
           document.getElementsByClassName('maindash')[0].classList.remove('maindashwide');
           this.closeSideBar();
       }
        // check for user logged in cookie, if true fetch users.
        if (this.state.isLoggedIn) {
//            this.fetchUsers();
            this.getfriends();
        }
        
//        this.getFriendConversations();
    };
        
    componentWillUpdate() {
        // will check if chat is empty or open.
        this.checkemptychat();
    }
    
    getFriendConversations() {
        // build loop function that updates state for conversations based on length of friends array in state. 
        let username = this.state.username;
        fetch(currentrooturl + 'users/getconversationlogs', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    username
                })
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                // `data` is the parsed version of the JSON returned from the above endpoint.
                console.log(data);  // { "userId": 1, "id": 1, "title": "...", "body": "..." }
                return data;
            })
        
        var conversationsArray = this.state.conversations;
         
        for (var i = 0; i < friends.length; i++) {
//            console.log(aconversationbetweenfriends[i]);
            conversationsArray.push(aconversationbetweenfriends[i]);
        }
        
        this.setState({conversations: [] });
    }
    
    fetchUsers() {
        // puts users taken from server script into state.
        fetch('/users')
        .then(res => res.json())
        .then(users => this.setState({users: users}))
        .catch(err => console.log('parse failed', err))
    }
    
    fetchlogout(e) {
        cookies.remove('loggedIn');
        cookies.remove('user');
        // puts users taken from server script into state.
        fetch('/users/logout');
    }
    
    closeSideBar() {
        this.refs.sidebar.classList.remove('sidebar-open');
        this.refs.sidebarx.classList.remove('sidebarxopen');
        document.getElementsByClassName('maindash')[0].classList.remove('maindashwide');
        document.getElementsByClassName('sidebarimg')[0].classList.remove('sidebarimg-open');
        this.setState({ sidebarStatus: 'closed', sidebarximgSrc: sidebaropenimg });
    }
    
    openSideBar() {
        this.refs.sidebar.classList.add('sidebar-open');
        this.refs.sidebarx.classList.add('sidebarxopen');
        document.getElementsByClassName('maindash')[0].classList.add('maindashwide');
        document.getElementsByClassName('sidebarimg')[0].classList.add('sidebarimg-open');
        this.setState({sidebarStatus: 'open', sidebarximgSrc: sidebarcloseimg });
    }

    checkemptychat() {
        for (var i = 0; i < document.getElementsByClassName('friendchat-chat-container').length; i++) {
            if (!document.getElementsByClassName('friendchat-chat-container')[i].children[0].children[0]) {
                console.log('chat empty');
                document.getElementsByClassName('friendchat-chat-container')[i].classList.add('friendchat-chat-container-empty');
            } else {
                console.log('chat not empty');
                document.getElementsByClassName('friendchat-chat-container')[i].classList.remove('friendchat-chat-container-empty');
            }
        }
    }
    
    // for loop, close all friend chats and open selected one. Apply class.
    togglechat(e) {

        console.log(e.target);
        for (var i = 0; i < document.getElementsByClassName('friendchat-chat-container').length; i++) {
            document.getElementsByClassName('friendchat-chat-container')[i].classList.remove('friendchat-chat-container-open');
            document.getElementsByClassName('friendchat-chat-container')[i].classList.add('friendchat-chat-container-closed');
            document.getElementsByClassName('friend-chat-form')[i].classList.remove('friend-chat-form-open');
            document.getElementsByClassName('friend-chat-input')[i].classList.remove('friend-chat-input-open');
            document.getElementsByClassName('friend-chat-submit')[i].classList.remove('friend-chat-submit-open');
        }
        
        if (e.target.parentElement.parentElement.parentElement.classList.contains('friendchat-chat-container-closed')) {
            console.log(e.target);
            e.target.parentElement.parentElement.parentElement.parentElement.classList.remove('friendchat-chat-container-closed');  
            e.target.parentElement.parentElement.parentElement.parentElement.children[0].classList.add('friendchat-chat-container-open'); 
            e.target.parentElement.parentElement.parentElement.parentElement.parentElement.children[4].children[0].classList.add('friend-chat-input-open'); 
            e.target.parentElement.parentElement.parentElement.parentElement.parentElement.children[4].children[1].classList.add('friend-chat-submit-open');
            e.target.parentElement.parentElement.parentElement.parentElement.parentElement.children[4].classList.add('friend-chat-form-open'); 
        }
        
    }
    
    searchusers() {
        // debounced fetch users event
        console.log ('searching users');
        let username = this.state.username;
        let searchusers = document.getElementById('usersearch').value;
        if (searchusers) {
            fetch(currentrooturl + 'users/searchusers', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    searchusers, username
                })
            })
            .then(function(response) {
                // You parse the data into a useable format using `.json()`
                return response.json();
            })
            .then(function(data) {
                // `data` is the parsed version of the JSON returned from the above endpoint.
                console.log(data);  // { "userId": 1, "id": 1, "title": "...", "body": "..." }
                return data;
            })
            .then((data) => {
                // set user data to 
                let currentsearchedusers = data;
                this.setState({ searchusers: currentsearchedusers });
            })
            .catch(error => { console.log(error);
            })
            document.getElementsByClassName('search-users-results-container')[0].classList.add('search-users-results-container-opened');
        } else if (!searchusers) {
            this.setState({ searchusers: [] });
            document.getElementsByClassName('search-users-results-container')[0].classList.remove('search-users-results-container-opened');
            // double check for input
            setTimeout(function() {
                if (!document.getElementById('usersearch').value) {
                    this.setState({ searchusers: [] });
                }
            }.bind(this), 500)
        }
    }
    
    debouncefetchusers = debounce(this.searchusers, 1000);
        
    fetchuserpreventsubmit = (e) => {
        // prevent submit on user search. Auto function with debounce using debouncefetchusers.
        e.preventDefault();
    }

    sendfriendrequest = (e) => {
        let thetitleofsomeonewewanttobecloseto = e.target.parentElement.parentElement.parentElement.getElementsByClassName('searched-user-username')[0].innerHTML;
        let username = this.state.username;
        fetch(currentrooturl + 'users/requestfriendship', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    thetitleofsomeonewewanttobecloseto, username
                })
            })
            .then(function(response) {
                // You parse the data into a useable format using `.json()`
                return response.json();
            })
            .then(function(data) {
                // `data` is the parsed version of the JSON returned from the above endpoint.
                console.log(data);  // { "userId": 1, "id": 1, "title": "...", "body": "..." }
                return data;
            })
            .catch(error => { console.log(error);
            })
        
        
        e.preventDefault(console.log(thetitleofsomeonewewanttobecloseto));
        // research users to update list
        this.debouncefetchusers();
    }
    
    revokefriendrequest = (e) => {
        let thetitleofsomeoneiusedtowanttobecloseto = e.target.parentElement.parentElement.parentElement.getElementsByClassName('searched-user-username')[0].innerHTML;
        let username = this.state.username;
        fetch(currentrooturl + 'users/revokefriendship', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                thetitleofsomeoneiusedtowanttobecloseto, username
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log(data);
            return data;
        })
        .catch(error => { console.log(error);
        })
        
        e.preventDefault(console.log('revoke friendship route'));
        this.debouncefetchusers();
    }
    
    acceptfriendrequest = (e) => {
        console.log('accept friend request');
        let username = this.state.username;
        let newfriend = e.target.parentElement.parentElement.parentElement.getElementsByClassName('searched-user-username')[0].innerHTML;
        
        fetch(currentrooturl + 'users/acceptfriendrequest', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                newfriend, username
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then((data) => {
            this.setState({ friends: data });
            return data;
        })
        .catch(error => { console.log(error);
        })
        
        e.preventDefault(console.log('accept friend request finished'));
        this.debouncefetchusers();
    }
    
    getpendingrequests = (e) => {
        let username = this.state.username;
        
        fetch(currentrooturl + 'users/pendingrequests', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                username
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then((data) => {
            console.log(data);
            let pendingfriendrequestquery = data;
            this.setState({ pendingfriendrequests: pendingfriendrequestquery });
            return data;
        })
        .catch(error => { console.log(error);
        })
        
        e.preventDefault(console.log('get pending requests'));  
    }
    
    getfriends = () => {
        let username = this.state.username;
        
        fetch(currentrooturl + 'users/getfriends', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                username
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then((data) => {
    //      console log friends 
    //      console.log(data);
            this.setState({ friends: data });
            return data;
        })
        .catch(error => { console.log(error);
        })
        
    }

    selectuser(e, user) {
        
    }

    beginchat = (e) => {
        let username = this.state.username;
        // if target is undefined, avoid crash.
        let chatwith;
        if (e.target.parentElement.parentElement.children[0].children[1]) {
            chatwith = e.target.parentElement.parentElement.children[0].children[1].innerHTML;
            console.log(username, chatwith);

            fetch(currentrooturl + 'users/beginchat', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    username, chatwith
                })
            })
            .then(function(response) {
                return response.json();
            })
            .then((data) => {
                console.log(data);
        //            this.setState({ friends: data });
                return data;
            })
            .catch(error => { console.log(error);
            })
            
        } else {
            console.log('undefined');
        }
        
        e.preventDefault(console.log('begin new chat'));  
    }
    
    toggleSideBar = () => {
        if (this.refs.sidebar.classList.contains('sidebar-open')) {
            this.closeSideBar();
            console.log(friends);
        } else {
            this.openSideBar();
        }
    }
    
    render() {
        let sidebar;
        
        const isLoggedIn = this.state.isLoggedIn;
        if (!isLoggedIn) {
            sidebar = <Login />
        } else {
            sidebar = <Social username={this.state.username} friends={this.state.friends} fetchlogout={this.fetchlogout} togglechat={this.togglechat} conversations={this.state.conversations} fetchusers={this.debouncefetchusers} fetchuserpreventsubmit={this.fetchuserpreventsubmit} searchusers={this.state.searchusers} sendfriendrequest={this.sendfriendrequest} revokefriendrequest={this.revokefriendrequest} toggleSideBar={this.toggleSideBar} getpendingrequests={this.getpendingrequests} pendingfriendrequests={this.state.pendingfriendrequests} acceptfriendrequest={this.acceptfriendrequest} beginchat={this.beginchat} />
        }
            
        return (
            <div>
                <div className="sidebar sidebar-open" ref="sidebar">
                    <div className="sidebarcontainer">
                        {sidebar}
                    </div>
                </div>
                <div className="sidebarx sidebarxopen" ref="sidebarx" onClick={this.toggleSideBar}>
                    <img className="sidebarimg" src={this.state.sidebarximgSrc} ref='sidebarximg'></img>
                </div>
            </div>
        );
    } 
};

// test debounce function 
function debounce(a,b,c){var d,e;return function(){function h(){d=null,c||(e=a.apply(f,g))}var f=this,g=arguments;return clearTimeout(d),d=setTimeout(h,b),c&&!d&&(e=a.apply(f,g)),e}}

// Watching video/Chat PAGE
// Video playing from server.
// video.title, video.description, video.thumnail, video.author, video.length, video.url, video.lastplayedat, video.thumbsup, video.thumbsdown, video.views, video.author.following.
// me.emitting, me.chats, me.chats.host.video, me.chats.host.user (user can contain 2 or more. Up to 16 for now.) me.chats.log
// Database tidbit. The chat is represented by an id. The host belongs to the chat id. The users involved belong to the host which sets up their privileges. The log belongs to chat id. When the host clicks a video & is emitting he changes the video, other users follow along if they are IN the chat currently watching the same video. You can be in the chat in social bar but you can JOIN the video emitting session aswell which changes the currently watched video.
// API request relevant videos using video.title & me.history

class App extends Component {
    constructor(props) {
        super(props); 

        this.state = { 
                        mainfeed: videofeed[0].main,
                     };
    }
    
    componentDidMount() {
        if (!cookies.get('Minireel')) {
            cookies.set('Minireel', 'minireel_sessionthistab', { path: '/', sameSite: true, signed: true }); 
        }
    }
        
    fetchData() {

    }
    
    render() {                    
        return (
            <BrowserRouter>
                <div className="App">
                    <Navbar />
                    <Socialbar />
                    <div className='maindashcontainer'>
                        <div className='main maindash'>
                            <Route exact path='/' render={(props) => (
                                <Dash {...props} mainfeed={this.state.mainfeed} />
                            )}/>
                            <Route path='/watch' render={(props) => (
                                <Video {...props} />
                            )}/>
                        </div>
                    </div>
                </div>
            </BrowserRouter>
        );
    }
}

export default App;