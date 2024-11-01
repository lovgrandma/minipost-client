import React, { Component } from 'react';
import currentrooturl from '../url';
import CKEditor from '@ckeditor/ckeditor5-react';
import ckEditor from 'ckeditor5-custom-build';
import {
    Button
} from 'react-bootstrap';
import {
    Link
} from 'react-router-dom';
import $ from 'jquery';
import TextareaAutosize from 'react-textarea-autosize';
import { get } from '../methods/utility.js';
import { setReplyData } from '../methods/responses.js';
import corsdefault from '../cors.js';

import { cookies } from '../App.js';

// Plugins not working: WordCount, Mention, Table, TableToolbar, Image, ImageCaption, Autoformat, CkFinderUploadAdapter, ImageToolbar
ckEditor.defaultConfig = {
    toolbar: ['heading', '|', 'Bold', 'Italic', 'UnderLine', 'Strikethrough', 'Highlight', 'Link', '|', 'Indent', 'Outdent', 'Alignment', '|', 'Superscript', 'Subscript', 'BlockQuote', 'Code', 'CodeBlock', 'BulletedList', 'NumberedList', 'Horizontalline', 'RemoveFormat', 'Emoji']
}

ckEditor.editorUrl= "../editor/ckeditor5/build/ckeditor.js";

export default class writeArticle extends Component {
    constructor(props) {
        super(props)
        this.state = {
            published: false, currentErr: "", textAreaHeight: 0, publishing: false, responseToMpd: "", responseToId: "", responseToTitle: "", responseToType: "", existingBody: "", editId: "", id: "", editorDidNotLoad: false, draftInterval: false, loadedFromExisting: false
        }
        this.placeholders = {
            somethingToSay: 'Got something to say? Write it here'
        }
        this.titleIn = React.createRef();
        this.byAuthor = React.createRef();
        this.editor = React.createRef();
    }

    componentDidMount() {
        this.setUpState();
        // console.log(ckEditor.builtinPlugins.map( plugin => plugin.pluginName ));
        if (this.props.location) {
            if (this.props.location.props) {
                if (this.props.location.props.responseToMpd && this.props.location.props.responseToTitle && this.props.location.props.responseToType) {
                    this.setState({ responseToMpd: this.props.location.props.responseToMpd, responseToTitle: this.props.location.props.responseToTitle, responseToType: this.props.location.props.responseToType });
                }
            }
        }
        if (window.location.search) {
            const urlParams = new URLSearchParams(window.location.search);
            let response = urlParams.get('r');
            let replyContent = '';
            let type = '';
            if (response) {
                if (response.match(/([a-zA-Z0-9].*)-([a-zA-Z0-9].*)/)) {
                    replyContent = response.match(/([a-zA-Z0-9].*)-([a-zA-Z0-9].*)/)[2];
                    if (response.match(/([a-zA-Z0-9].*)-([a-zA-Z0-9].*)/)[1] == 'a') {
                        type = 'a';
                    } else if (response.match(/([a-zA-Z0-9].*)-([a-zA-Z0-9].*)/)[1] == 'v') {
                        type = 'v';
                    }
                }
                if (type && replyContent) {
                    setReplyData.call(this, response);
                }
            }
        }

        let i = 0;
        const editorLoaded = (i, time) => {
            if (!this.editor.data) {
                this.setState({ editorDidNotLoad: true });
                if (i > 0) {
                    i--;
                }
            } else {
                this.setState({ editorDidNotLoad: false });
                if (i < 10) {
                    i++;
                }
            }
            editorConfirmLoaded(i, time);
        };

        const editorConfirmLoaded = (i, time) => {
            setTimeout(() => {
                editorLoaded(i, time);
            }, i*time);
        }
        editorConfirmLoaded(1, 1500);
        window.addEventListener("mousedown", this.handleClick);
    }

    componentWillUnmount() {
        try {
            window.removeEventListener("mousedown", this.handleClick);
            clearInterval(this.state.draftInterval);
        } catch (err) {
            // Fail silently
        }
    }

    randomProperty(obj) {
        let keys = Object.keys(obj);
        return obj[ keys[ keys.length * Math.random() << 0]];
    }

    cacheDraftInterval() {
        try {
            // Dont update cache if loading from existing article. Should not be called anyways since it is only called if there is no existing data on word processor anyways
            if (!this.state.loadedFromExisting) {
                if (window.localStorage.getItem("articledraft")) {
                    this.editor.setData(window.localStorage.getItem("articledraft"));
                }
                if (window.localStorage.getItem("articletitledraft")) {
                    this.titleIn.current._ref.value = window.localStorage.getItem("articletitledraft");
                }
                if (!this.state.draftInterval) {
                    let interval = setInterval(() => {
                        let da = this.editor.getData();
                        window.localStorage.setItem("articledraft", da);
                        let ti = this.titleIn.current._ref.value;
                        window.localStorage.setItem("articletitledraft", ti);
                    }, 15000);
                    this.setState({ draftInterval: interval });
                }
            }
        } catch (err) {
            console.log(err);
            // Fail silently
        }
    }

    /** Runs when user loads page by clicking from another page. Will not function when page is loaded from direct link or reload */
    setUpState() {
        if (get(this, 'props.location.props')) {
            if (this.props.location.props.responseToId) {
                this.setState({ responseToId: this.props.location.props.responseToId });
            }
            if (this.props.location.props.responseToMpd) {
                this.setState({ responseToMpd: this.props.location.props.responseToMpd });
            }
            if (this.props.location.props.responseToTitle) {
                this.setState({ responseToTitle: this.props.location.props.responseToTitle });
            }
            if (this.props.location.props.responseToType) {
                this.setState({ responseToType: this.props.location.props.responseToType });
            }
            if (this.props.location.props.title) {
                this.titleIn.current._ref.value = this.props.location.props.title;
            }
            if (this.props.location.props.body) {
                this.setState({ existingBody: this.props.location.props.body });
            }
            if (this.props.location.props.id) {
                this.setState({ editId: this.props.location.props.id });
            }
        }
    }

    /** Experimental keeps bar open when user clicks bar or textfield. This is the only usage of jquery in the application. Checks if the target clicked is a descendant of the editor container */
    handleClick = (e) => {
        try {
            if (document.getElementsByClassName('ck-editor') && document.getElementsByClassName('ck-sticky-panel__content') && document.getElementsByClassName('ck-editor__editable')) {
                if (!$.contains(document.getElementsByClassName('ck-editor')[0], e.target)) {
                    if (document.getElementsByClassName('ck-sticky-panel__content')[0]) {
                        document.getElementsByClassName('ck-sticky-panel__content')[0].style.visibility = "hidden";
                    }
                    if (document.getElementsByClassName('ck-editor__editable')[0]) {
                        document.getElementsByClassName('ck-editor__editable')[0].classList.remove('ck-focused');
                        document.getElementsByClassName('ck-editor__editable')[0].classList.add('ck-blurred');
                    }
                }
                if ($.contains(document.getElementsByClassName('ck-sticky-panel__content')[0], e.target) || e.target.classList.contains('ck-toolbar__items')) {
                    setTimeout(() => {
                        if (document.getElementsByClassName('ck-sticky-panel__content')[0].style.visibility == 'visible') {
                            document.getElementsByClassName('ck-editor__editable')[0].classList.remove('ck-blurred');
                            document.getElementsByClassName('ck-editor__editable')[0].classList.add('ck-focused');
                        }
                    }, 2);
                }
                this.catchBlur(2);
            }
        } catch (err) {
            // Something went wrong
        }
    }

    catchBlur(timeout) {
        setTimeout(() => {
            try {
                // Circumvent blurring/focusing logic in core ckeditor. Blurs and focuses editor bar with editor textfield appropriately
                if (document.getElementsByClassName('ck-stsicky-panel__content') && document.getElementsByClassName('ck-editor__editable')) {
                    if (document.getElementsByClassName('ck-sticky-panel__content')[0] && document.getElementsByClassName('ck-editor__editable')[0]) {
                        if (document.getElementsByClassName('ck-sticky-panel__content')[0].style.visibility == "visible") {
                            document.getElementsByClassName('ck-editor__editable')[0].classList.remove('ck-blurred');
                            document.getElementsByClassName('ck-editor__editable')[0].classList.add('ck-focused');
                        } else {
                            document.getElementsByClassName('ck-editor__editable')[0].classList.remove('ck-focused');
                            document.getElementsByClassName('ck-editor__editable')[0].classList.add('ck-blurred');
                        }
                    }
                }
            } catch (err) {
                // Component unmounted
            }
        }, timeout);
    }

    /* Publish article route. Will fire fetch request to post document of article on database and publish */
    publishArticle() {
        try {
            if (cookies.get('loggedIn') && !this.state.published) {
                if (this.titleIn.current._ref.value.length > 0 && this.editor.getData().length > 250) {
                    this.setState({ publishing: true });
                    const author = cookies.get('loggedIn');
                    const username = author;
                    const body = this.editor.getData();
                    const title = this.titleIn.current._ref.value;
                    let responseTo = "";
                    let responseType = "";
                    if (this.state.responseToType) {
                        responseType = this.state.responseToType;
                        if (this.state.responseToMpd) {
                            responseTo = this.state.responseToMpd;
                        } else if (this.state.responseToId) {
                            responseTo = this.state.responseToId;
                        }
                    }
                    let edit = false;
                    let id = "";
                    if (this.props.edit) {
                        edit = true;
                        id = this.state.editId;
                    }
                    let hash = cookies.get('hash');
                    let self = true;
                    fetch(currentrooturl + 'm/publisharticle', {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        credentials: corsdefault,
                        body: JSON.stringify({
                            author, title, body, responseTo, responseType, edit, id, username, hash, self
                        })
                    })
                    .then((response) => {
                        return response.json(); // Parsed data
                    })
                    .then((data) => {
                        let authenticated = this.props.checkAndConfirmAuthentication(data);
                        if (data && authenticated) {
                            if (data.id) {
                                this.setState({ id: data.id });
                            }
                            if (data.querystatus == "article posted") {
                                this.setState({ published: true });
                                this.setState({ currentErr: "" });
                                window.localStorage.setItem("articledraft", "");
                                window.localStorage.setItem("articletitledraft", "");
                            } else if (data.querystatus == "you have already posted an article with this title") {
                                this.setState({ currentErr: "You have already posted an article with this title" });
                                window.localStorage.setItem("articledraft", "");
                                window.localStorage.setItem("articletitledraft", "");
                            } else if (data.querystatus == "article updated") {
                                this.setState({ published: true });
                                this.setState({ currentErr: "" });
                            }
                        }
                    })
                    .then(() => {
                        this.setState({ publishing: false });
                    });
                } else {
                    if (this.titleIn.current._ref.value.length == 0 && this.editor.getData().length < 250) {
                        this.setState({ currentErr: "An article needs a title and atleast 250 characters of content, please review your article" });
                    } else if (this.titleIn.current._ref.value.length == 0) {
                        this.setState({ currentErr: "An article needs a title" });
                    } else if (this.editor.getData().length < 250) {
                        this.setState({ currentErr: "An article needs atleast 250 characters of content, please review your article" });
                    }
                }
            } else {
                this.setState({ currentErr: "You must be logged in to publish an article" });
            }
        } catch (err) {
            // Fetch failed to fire
            console.log(err);
            this.setState({ publishing: false });
        }
    }

    /* Sets author div to visible when title is hovered over for peace of mind when typing */
    setAuthorVisible(e, bool) {
        try {
            if (this.byAuthor.current) {
                if (bool) {
                    this.byAuthor.current.classList.add("grey-out-show");
                } else {
                    this.byAuthor.current.classList.remove("grey-out-show");
                }
            }
        } catch (err) {
            // Ref on document did not exist
        }
    }

    reduceTitleSize(e) {
        if (get(this, 'titleIn.current._ref')) {
            if (this.titleIn.current._ref.value.length > 200 && $("#upl-article-title")) {
                e.preventDefault();
                let temp = this.titleIn.current._ref.value;
                temp = temp.slice(0, 200);
                $("#upl-article-title").val(temp);
            }
        }
    }

    deleteErr(e) {
        if (this) {
            this.setState({ currentErr: "" });
        }
    }

    setResponseParentLink() {
        if (this.state.responseToMpd) { // Response is video set watch pathname
            return {
                pathname:`/watch?v=${this.state.responseToMpd}`
            }
        } else if (this.state.responseToId) { // Response is article set read pathname
            return {
                pathname:`/read?a=${this.state.responseToId}`
            }
        } else {
            return {
                pathname:`/`
            }
        }
    }

    render() {
        return (
            <div>
                <div className="editor-container">
                    <div className="write-an-article-prompt">{ !this.props.edit ? "Write an article" : "Edit an article"}</div>
                    <div className={this.state.currentErr ? "article-err-status err-status" : "article-err-status hidden"} onClick={(e)=>{this.deleteErr(e)}}>{this.state.currentErr ? this.state.currentErr: ""}<span className="times-exit-float-right">&times;</span></div>
                    { !cookies.get('loggedIn') ? <div className="prompt-basic grey-out">You are not logged in please log in to write an article</div> : null }
                    <div className={cookies.get('loggedIn') && !this.state.published ? "write-article-editor-container" : "write-article-editor-container hidden"}>
                        {this.props.edit ? <div className="currently-editing">currently editing</div> : null }
                        <TextareaAutosize type='text' id="upl-article-title" className="fixfocuscolor" ref={this.titleIn} onMouseOver={(e) => {this.setAuthorVisible(e, true)}} onMouseOut={(e) => {this.setAuthorVisible(e, false)}} onInput={(e) => {this.reduceTitleSize(e)}} onKeyUp={(e) => {this.reduceTitleSize(e)}} onKeyDown={(e) => {this.reduceTitleSize(e)}} rows="1" name="upl-article-title" placeholder="title" autoComplete="off"></TextareaAutosize>
                        <div className={cookies.get('loggedIn') && !this.state.published ? "write-article-author prompt-basic-s grey-out-hide" : "write-article-author hidden"} ref={this.byAuthor}>by {this.props.isLoggedIn}</div>
                        <CKEditor
                            editor={ ckEditor }
                            config={{
                                placeholder:this.randomProperty(this.placeholders)
                            }}
                            onInit={ editor => {
                                try {
                                    // You can store the "editor" and use when it is needed.
                                    this.editor = editor;
                                    if (this.state.existingBody) {
                                        editor.setData(this.state.existingBody);
                                        this.setState({ loadedFromExisting: true });
                                    } else {
                                        this.cacheDraftInterval();
                                    }
                                    document.getElementsByClassName('ck-sticky-panel__content')[0].style.visibility = "hidden";
                                } catch (err) {
                                    // Fail silently
                                }
                            } }
                            onChange={ ( event, editor ) => {
                                const data = editor.getData();
                                // console.log( { event, editor, data } );
                            } }
                            onBlur={ ( event, editor ) => {
                                this.catchBlur(2);
                            } }
                            onFocus={ ( event, editor ) => {
                                try {
                                    document.getElementsByClassName('ck-sticky-panel__content')[0].style.visibility = "visible";
                                } catch (err) {
                                    // Fail silently
                                }
                            } }
                        />
                        <div className={this.state.responseToTitle ? "response-title prompt-basic grey-out" : "hidden"}>Responding to <Link to={this.setResponseParentLink()}>{this.state.responseToTitle}</Link></div>
                        {
                            this.state.editorDidNotLoad ?
                                <div>It seems the editor did not load, this usually only occurs when loading for the first time, please refresh</div>
                                : null
                        }
                        <Button className={!this.state.published ? "publish-button publish-button-article" : "publish-button publish-button-article publish-button-hidden"} onClick={(e) => {this.publishArticle(e)}}>Publish</Button>
                    </div>
                    <div className={this.state.published ? "prompt-basic publish-confirmed" : "prompt-basic publish-confirmed publish-confirmed-hidden weight600"}>Your article was published, view it <Link to={{ pathname:`/read?a=${this.state.id}`}}>here</Link></div>
                </div>
            </div>
        )
    }
}
