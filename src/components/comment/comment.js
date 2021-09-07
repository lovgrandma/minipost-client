import React, { Component, lazy, Suspense } from 'react';
import {
    NavLink
} from 'react-router-dom';
import { publishNewComment, getComments, openReply, getMoreReplies } from '../../methods/comments.js';
import TextareaAutosize from 'react-textarea-autosize';
import dummyavatar from '../../static/greyavatar.jpg'

export default class Comment extends Component { // friend component fc1
    constructor(props) {
            super(props);
            this.state = { 
                commented: false, error: null, comments: [], openReplyTo: null, commentedSub: false, subId: null, subLength: 5, replyToParent: null
            }
            this.mainNewComment = new React.createRef();
            this.subNewComment = new React.createRef();
        }

    async componentDidMount() {
        try {
            await getComments.call(this, this.getMedia(this.props.mediaType), this.props.mediaType);
        } catch (err) {
            return false;
        }
    }

    getMedia(type = "video") {
        let qs = window.location.search;
        const urlParams = new URLSearchParams(qs);
        if (type == "video") {
            return urlParams.get('v');
        } else {
            return urlParams.get('a');
        }
    }

    checkFriendMatch = (user) => {
        try {
            if (this.props.copyFriends && user) {
                if (Array.isArray(this.props.copyFriends)) {
                    if (this.props.copyFriends.indexOf(user) > -1) {
                        return true;
                    }
                }
            }
            return false;
        } catch (err) {
            return false;
        }
    }
    

    render() {
        return (
            <div className="comments-component-container">
                {
                    this.props.username ?
                        !this.state.commented ?
                            <div className="new-comment-main-container">
                                    <TextareaAutosize className={ this.state.commented ? "textarea-new-comment-autosize new-comment-commented fixfocuscolor prompt-basic-s" : "textarea-new-comment-autosize fixfocuscolor prompt-basic-s" } ref={this.mainNewComment} placeholder="Compose Comment" />
                                    <button className="new-comment-submit red-btn" onClick={(e) => {publishNewComment.call(this, e, "main", this.props.media, this.props.mediaType)}} type='submit' value='submit'>Comment</button>
                            </div>
                            : <div className="new-comment-submit weight600 prompt-basic-s grey">Comment Published</div>
                        : null
                }
                <div className="comment-stream">
                    {
                        this.state.comments ?
                            this.state.comments.map ?
                                this.state.comments.map((comment) => 
                                    comment.id ?
                                        <div className="single-comment-container">
                                            <div className="single-comment-content">
                                                <img className="commentavatar" src={this.props.cloud && comment.avatarurl ? this.props.cloud.length > 0 && this.props.cloud.length > 0 ? this.props.cloud + "/av/" + comment.avatarurl : dummyavatar : dummyavatar}></img>
                                                <div className="flex flex-start comment-auth-meta-container">
                                                    <NavLink exact to={"/profile?p=" + comment.author} className="to-profile-link-btn fit-content">
                                                        <div className="comment-author-name-container">
                                                            <div className="weight600 prompt-basic-s grey-out">{comment.author}</div>
                                                                {
                                                                    this.checkFriendMatch(comment.author) ?
                                                                        <div class="prompt-basic material-icons friends-comment-icon">people</div>
                                                                        : null
                                                                }
                                                        </div>
                                                    </NavLink>
                                                    <div className="prompt-basic">{comment.content}</div>
                                                    <div className="comment-meta-actions">
                                                        {
                                                            this.state.openReplyTo == comment.id ?
                                                                this.state.commentedSub ?
                                                                    <div className="new-comment-submit weight600 prompt-basic-s grey">Reply Published</div>
                                                                    : <div className="new-comment-sub-container">
                                                                            <TextareaAutosize className={ this.state.commentedSub ? "textarea-new-comment-autosize new-comment-commented fixfocuscolor prompt-basic-s" : "textarea-new-comment-autosize fixfocuscolor prompt-basic-s" } ref={this.subNewComment} placeholder="Compose Comment" />
                                                                            <button className="new-comment-submit red-btn" onClick={(e) => {publishNewComment.call(this, e, "sub", this.props.media, this.props.mediaType)}} type='submit' value='submit'>Comment</button>
                                                                    </div>
                                                                : <div className="reply-to prompt-basic-s weight600 italicized grey-out" onClick={(e) => {openReply.call(this, e, comment)}}>reply</div>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            {
                                                comment.replies ?
                                                    <div>
                                                        {
                                                            comment.replies.map((subCom) =>
                                                                subCom.id ?
                                                                    <div className="flex flex-start comment-auth-meta-container sub-comment-auth-container">
                                                                        <NavLink exact to={"/profile?p=" + subCom.author} className="to-profile-link-btn fit-content">
                                                                            <div class="comment-author-name-container">
                                                                                <div className="weight600 prompt-basic-s grey-out">{subCom.author}</div>
                                                                                {
                                                                                    this.checkFriendMatch(subCom.author) ?
                                                                                        <div class="prompt-basic material-icons friends-comment-icon">people</div>
                                                                                        : null
                                                                                }
                                                                            </div>
                                                                        </NavLink>
                                                                        <div className="prompt-basic">{subCom.content}</div>
                                                                        <div className="comment-meta-actions">
                                                                            {
                                                                                this.state.openReplyTo == subCom.id ?
                                                                                    this.state.commentedSub ?
                                                                                        <div className="new-comment-submit weight600 prompt-basic-s grey">Reply Published</div>
                                                                                        : <div className="new-comment-sub-container">
                                                                                                <TextareaAutosize className={ this.state.commentedSub ? "textarea-new-comment-autosize new-comment-commented fixfocuscolor prompt-basic-s" : "textarea-new-comment-autosize fixfocuscolor prompt-basic-s" } ref={this.subNewComment} placeholder="Compose Comment" />
                                                                                                <button className="new-comment-submit red-btn" onClick={(e) => {publishNewComment.call(this, e, "sub", this.props.media, this.props.mediaType, true)}} type='submit' value='submit'>Comment</button>
                                                                                        </div>
                                                                                    : <div className="reply-to prompt-basic-s weight600 italicized" onClick={(e) => {openReply.call(this, e, subCom, comment)}}>reply</div>
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    : null
                                                            )
                                                        }
                                                        {
                                                            comment.replies.length > 0 ?
                                                                <div>
                                                                    <button class="load-more-btn" type="button" onClick={(e) => {getComments.call(this, this.getMedia(this.props.mediaType), this.props.mediaType, comment.id, this.state.subLength)}}>Load More</button>
                                                                </div>
                                                                : null
                                                        }
                                                    </div>
                                                    : null
                                            }
                                        </div>
                                        : null
                                ) 
                                : null
                            : null
                    }
                </div>
            </div>
        )
    }
}
