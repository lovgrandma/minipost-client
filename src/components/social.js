import React, { Component } from 'react';
import Request from './request.js'; import Friend from './friend.js'; import SearchedUserResults from './searcheduserresults.js'; import NonFriendConversation from './nonfriendconversation.js'; import Sidebarfooter from './sidebarfooter.js';
import angleDoubleLeft from '../static/angle-double-left-solid.svg'; import friendswhite from '../static/friendsWhite.svg'; import nonFriendsWhite from '../static/nonFriendsWhite.svg';
import { cookies } from '../App.js';
import {
    Link
} from 'react-router-dom';

const typingRegex = /([a-z0-9.]*);([^]*);(.*)/; // regular expression for reading 'typing' emits

export default function Social(props) { // social prop sp1
    let limit;
    let setlimit = (e) => {
        if (props.searchusers[0] && props.searchusers[1].moreusers) {
            /* Runs search query to return current search user length plus 10 more users */
            props.limitedsearch(props.username, props.searchusers[0].length+10); // Does limited search for more users in search bar
        }
    }

    let pendingsetvalue = false;
    if (props.pendinghidden == "hidden") {
        pendingsetvalue = "show";
    } else {
        pendingsetvalue = "hidden";
    }

    let returnLink = (author) => {
        try {
            if (author) {
                return { pathname:`/profile?${"p=" + author}` };
            }
        } catch (err) {
            return { pathname:`/profile` };
            // Something went wrong
        }
    }

    let childCounter = 0;
    return (
        <div id="socialContainer">
            <div className="userquickdash row">
                <div className="friend-requests-view">
                    <button className="following-view" onClick={(e) => {props.showfollowing(props.showingfollows)}}>following</button>
                    <button className="requests-view" onClick={(e) => {props.getpendingrequests(pendingsetvalue, true, props.username)}}>requests</button>
                </div>
                <div>
                    <img className="minimize-dash" src={angleDoubleLeft} alt="hamburger" onClick={props.toggleSideBar}></img>
                </div>
            </div>
            <div className={props.pendinghidden == "hidden" ? 'friend-requests-list-hidden' : 'friend-requests-list'}>
                <div>
                    {props.pendingfriendrequests ?
                        props.pendingfriendrequests.map ?
                            props.pendingfriendrequests.map(function(request, index) {
                            return (
                                <Request
                                userrequest={request.username}
                                acceptfriendrequest={props.acceptfriendrequest}
                                revokefriendrequest={props.revokefriendrequest}
                                key={childCounter}
                                index={childCounter++}
                                />
                            )
                        })
                    : <div></div> : <div></div>
                    }
                </div>
            </div>
            <div className={props.showingfollows == "hidden" ? 'friend-requests-list-hidden' : 'friend-requests-list'}>
                <div>
                    { props.following ?
                        props.following.map ?
                            props.following.map(function(subscribed, index) {
                                return (
                                    <div className="following-flex" key={index}>
                                        <div className='channel-following-container'><span className="following-prefix">following</span> <Link to={returnLink(subscribed.channel)} className="channel-author"><span className="following-channel">{subscribed.channel}</span></Link></div>
                                        <div className='small-following-unfollow-button' onClick={(e) => {props.follow(subscribed.channel, false)}}>unfollow</div>
                                    </div>
                                )
                        })
                    : <div></div> : <div></div>
                    }
                </div>
            </div>
            <div>
                <form className="search-form-flex-users" onInput={props.debouncefetchusers} onChange={props.searchforminput} onSubmit={props.fetchuserpreventsubmit} noValidate='noValidate' autoComplete='off'>
                    <span className="text-input-wrapper searchusers-text-input">
                        <input className="user-search" id="usersearch" type="search" placeholder="Search users.." name="usersearch"></input>
                        <span className="clear" onClick={props.searchformclear} title="Clear">&times;</span>
                    </span>
                </form>
            </div>
            <div className='search-users-results-container'>
                <div>
                    {
                    props.searchusers ?
                        props.searchusers[0] ?
                            props.searchusers[0].map(function(searcheduser, index) {

                                let alreadypending = function() {  // Determine if the user is on searched users pending list. Waiting for them to accept
                                    for (var i = 0; i < searcheduser.friends[1].pending.length; i++) {
                                        if (searcheduser.friends[1].pending[i]) {
                                            if (searcheduser.friends[1].pending[i].username === props.username) {
                                                return true;
                                            }
                                        }
                                    }
                                }

                                let requestwaiting = function() { // Determine if searched user is waiting for user to accept friend request.
                                    for (var i = 0; i < props.searchusers[0].length; i++) { // Iterate through the searched users
                                        if (props.searchusers[0] && props.pendingfriendrequests) {
                                            for (let j = 0; j < props.pendingfriendrequests.length; j++) {
                                                if (props.pendingfriendrequests[j].username === searcheduser.username) {
                                                    return true;
                                                }
                                            }
                                        }
                                    }
                                }

                                let alreadyfriends = function() { // Determine if already friends with this searched user
                                    for (var i = 0; i < props.friends.length; i++) {
                                        if (props.friends[0]) {
                                            if(props.friends[i].username === searcheduser.username) {
                                                return true;
                                            }
                                        }
                                    }
                                }

                                let yourself = function() { // Determine if searched user is self
                                    if(props.username === searcheduser.username) {
                                        return true;
                                    }
                                }

                                return (
                                    <SearchedUserResults searcheduser={searcheduser.username}
                                    searchtotal={props.searchusers[0].length}
                                    key={childCounter}
                                    index={childCounter++}
                                    sendfriendrequest={props.sendfriendrequest}
                                    acceptfriendrequest={props.acceptfriendrequest}
                                    revokefriendrequest={props.revokefriendrequest}
                                    alreadypending={alreadypending}
                                    requestwaiting={requestwaiting}
                                    alreadyfriends={alreadyfriends}
                                    yourself={yourself}
                                    beginchat={props.beginchat}
                                    />
                                )

                            })
                        : <div></div>
                    : <div></div>
                    }
                <div className="load-more-users-wrapper"><button className="load-more-users" onClick={setlimit}>{ props.searchusers ? props.searchusers[1] ? props.searchusers[1].moreusers ? "load more users" : "no more users" : "load more users" : "load more users"}</button></div> {/* Loads more users if more users present */}
                </div>
            </div>
            <div className="search-friend-border noselect" onClick={e => props.friendsSocialToggle("friend")}><img className="general-icon" src={friendswhite} alt="friends"></img><div className="friends-header">friends</div></div>
            <div className={props.friendsopen ?
                                "friendchatcontainer friendchatcontainer-open"
                            : "friendchatcontainer friendchatcontainer-closed"
                           } refs='friendchatcontainer'>

                {/* Append friends from social bar state (props.friends). For each friend return appropriate object info to build Friends div using Friends(props) function above. */}
                {
                    props.friends && props.conversations ?
                        props.friends.length === 0 ? <div className="nofriends">Right now you have no friends :( , but you can add one :) . Use the search bar above to send friend requests or ask friends to add you</div>
                        :
                        props.friends.map(function(friend, index) {
                            let convo;
                            for (let i = 0; i < props.conversations.length; i++) {
                                if (props.conversations[i]) {
                                    if (props.conversations[i].users) {
                                        if (props.conversations[i].users.length == 2) {
                                            for (let j = 0; j < props.conversations[i].users.length; j++) {
                                                if (props.conversations[i].users[j] === friend.username) {
                                                    convo = props.conversations[i];
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            let typing;
                            if (convo) {
                                for (let i = 0; i < props.typing.length; i++) {
                                    if (props.typing[i].match(typingRegex)[3] == convo._id) {
                                        typing = props.typing[i];
                                    }
                                }
                            }

                            return (
                                <Friend username={props.username}
                                friend={friend.username}
                                friendstotal={props.friends.length}
                                cloud={props.cloud}
                                avatarurl = {friend.avatarurl}
                                key={childCounter}
                                index={childCounter++}
                                conversation = {convo}
                                beginchat={props.beginchat}
                                revokefriendrequest={props.revokefriendrequest}
                                friendchatopen={props.friendchatopen}
                                updatefriendchatopen={props.updatefriendchatopen}
                                typing={typing}
                                bump={props.bump}
                                />
                            )
                        })
                    : <div></div>
                }

            </div>
            <div className="search-nonfriend-border noselect" onClick={e => props.friendsSocialToggle("nonFriend")}><img className="general-icon" src={nonFriendsWhite} alt="friends"></img><div className="nonfriends-header">other conversations</div></div>
            <div className={props.nonfriendsopen ? "nonfriendchatcontainer nonfriendchatcontainer-open" : "nonfriendchatcontainer nonfriendchatcontainer-closed"} refs='nonfriendchatcontainer'>
                {props.conversations ?
                    props.conversations.length > 0 ?
                        props.conversations.map(function(conversation, index) {
                            let person = "";
                            let conversationOfFriends = function() { // determine if a conversation between friends
                                for (let i = 0; i < props.friends.length; i++) { // iterate thr each friend
                                    if (conversation) {
                                        if (conversation.users.length == 2) { // valid 2 user chat
                                            for (let k = 0; k < conversation.users.length; k++) { // iterate thr each user in conversation
                                                if (props.friends[i].username == conversation.users[k]) { // if iterated friend == iterated user in chat
                                                    return true; // Then this is a friend chat, return true to not show in extra chats
                                                }
                                            }
                                        } else {
                                            return true; // else invalid return true (Doesnt confirm that this is a conversation w a friend, but confirms it should not show in other chats)
                                        }
                                    } else {
                                        return false;
                                    }
                                }
                                return false;
                            }

                            if (!conversationOfFriends()) { // if this conversation has a user that is not listed in friends list
                                 return (
                                    <NonFriendConversation username={props.username}
                                     otheruserchatopen={props.otheruserchatopen}
                                     key={childCounter}
                                     index={childCounter++}
                                     conversation={conversation}
                                     updateotheruserchatopen={props.updateotheruserchatopen}
                                     beginchat={props.beginchat}
                                     pendingfriendrequests={props.pendingfriendrequests}
                                     acceptfriendrequest={props.acceptfriendrequest}
                                     revokefriendrequest={props.revokefriendrequest}
                                     fetchusers={props.fetchusers}
                                     searchforminput={props.searchforminput}
                                     />
                                 )
                            }
                        }) : <div></div>
                    :<div></div>
                }
            </div>
            <Sidebarfooter username={props.username}
            logout={props.fetchlogout}
            />
        </div>
    )
}
