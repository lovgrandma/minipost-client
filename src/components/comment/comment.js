import React, { Component, lazy, Suspense } from 'react';
import { publishNewComment, getComments } from '../../methods/comments.js';
import TextareaAutosize from 'react-textarea-autosize';
import dummyavatar from '../../static/greyavatar.jpg'

export default class Comment extends Component { // friend component fc1
    constructor(props) {
            super(props);
            this.state = { 
                commented: false, error: null, comments: []
            }
            this.mainNewComment = new React.createRef();
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
                            this.state.comments.map((comment) => 
                                <div className="single-comment-container">
                                    <div className="single-comment-content">
                                        <img className="commentavatar" src={this.props.cloud && comment.avatarurl ? this.props.cloud.length > 0 && this.props.cloud.length > 0 ? this.props.cloud + "/av/" + comment.avatarurl : dummyavatar : dummyavatar}></img>
                                        <div className="flex flex-start comment-auth-meta-container">
                                            <div className="weight600 prompt-basic-s grey-out">{comment.author}</div>
                                            <div className="prompt-basic">{comment.content}</div>
                                            <div className="comment-meta-actions">
                                                <div className="reply-to prompt-basic-s weight600 italicized grey-out">reply</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) 
                            : null
                    }
                </div>
            </div>
        )
    }
}
