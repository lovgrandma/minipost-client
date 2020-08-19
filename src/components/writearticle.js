import React, {Component} from 'react';
import currentrooturl from '../url';
import CKEditor from '@ckeditor/ckeditor5-react';
// import inlineEditor from '@ckeditor/ckeditor5-build-inline';
import ckEditor from 'ckeditor5-custom-build';
//import ckEditor from 'ckeditor4-react';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import $ from 'jquery';
import TextareaAutosize from 'react-textarea-autosize';

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
            published: false, currentErr: "", textAreaHeight: 0, publishing: false, responseMpd: "", responseTitle: "", responseType: ""
        }
        this.placeholders = {
            somethingToSay: 'Got something to say? Write it here'
        }
        this.titleIn = React.createRef();
        this.byAuthor = React.createRef();
        this.editor = React.createRef();
    }

    componentDidMount() {
        // console.log(ckEditor.builtinPlugins.map( plugin => plugin.pluginName ));
        if (this.props.location) {
            if (this.props.location.props) {
                if (this.props.location.props.responseMpd && this.props.location.props.responseTitle && this.props.location.props.responseType) {
                    this.setState({ responseMpd: this.props.location.props.responseMpd, responseTitle: this.props.location.props.responseTitle, responseType: this.props.location.props.responseType });
                }
            }
        }
        window.addEventListener("mousedown", this.handleClick);
    }

    componentWillUnmount() {
        window.removeEventListener("mousedown", this.handleClick);
    }

    randomProperty(obj) {
        let keys = Object.keys(obj);
        return obj[ keys[ keys.length * Math.random() << 0]];
    }

    /** Experimental keeps bar open when user clicks bar or textfield. This is the only usage of jquery in the application. Checks if the target clicked is a descendant of the editor container */
    handleClick(e) {
        try {
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
        } catch (err) {
            // A document element was not accessible
        }
    }

    catchBlur(timeout) {
        setTimeout(() => {
            try {
                // Circumvent blurring/focusing logic in core ckeditor. Blurs and focuses editor bar with editor textfield appropriately
                if (document.getElementsByClassName('ck-sticky-panel__content')[0] && document.getElementsByClassName('ck-editor__editable')[0]) {
                    if (document.getElementsByClassName('ck-sticky-panel__content')[0].style.visibility == "visible") {
                        document.getElementsByClassName('ck-editor__editable')[0].classList.remove('ck-blurred');
                        document.getElementsByClassName('ck-editor__editable')[0].classList.add('ck-focused');
                    } else {
                        document.getElementsByClassName('ck-editor__editable')[0].classList.remove('ck-focused');
                        document.getElementsByClassName('ck-editor__editable')[0].classList.add('ck-blurred');
                    }
                }
            } catch (err) {
                // A document element was not accessible
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
                    const body = this.editor.getData();
                    const title = this.titleIn.current._ref.value;
                    let responseTo = "";
                    let responseType = "";
                    if (this.state.responseMpd && this.state.responseType) {
                        responseTo = this.state.responseMpd;
                        responseType = this.state.responseType;
                    }
                    fetch(currentrooturl + 'm/publisharticle', {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({
                            author, title, body, responseTo, responseType
                        })
                    })
                    .then((response) => {
                        return response.json(); // Parsed data
                    })
                    .then((data) => {
                        if (data.querystatus == "article posted") {
                            this.setState({published: true });
                        } else if (data.querystatus == "you have already posted an article with this title") {
                            this.setState({ currentErr: "You have already posted an article with this title" });
                        }
                        console.log(data);
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
        try {
            if (this.titleIn.current) {
                if (this.titleIn.current._ref.value.length > 200) {
                    e.preventDefault();
                    let temp = this.titleIn.current._ref.value
                    temp = temp.slice(0, 200);
                    $("#upl-article-title").val(temp);
                }
            }
        } catch (err) {
            console.log(err);
            // Ref on document did not exist
        }
    }

    deleteErr(e) {
        this.setState({ currentErr: "" });
    }

    render() {
        return (

            <div>
                <div className="editor-container">
                    <div className="write-an-article-prompt">Write an article</div>
                    <div className={this.state.currentErr ? "article-err-status err-status" : "article-err-status hidden"} onClick={(e)=>{this.deleteErr(e)}}>{this.state.currentErr ? this.state.currentErr: ""}<span className="times-exit-float-right">&times;</span></div>
                    {!cookies.get('loggedIn') ? <div className="prompt-basic grey-out">You are not logged in please log in to write an article</div> : null}
                    <div className={cookies.get('loggedIn') && !this.state.published ? "write-article-editor-container" : "write-article-editor-container hidden"}>
                        <TextareaAutosize type='text' id="upl-article-title" className="fixfocuscolor" ref={this.titleIn} onMouseOver={(e) => {this.setAuthorVisible(e, true)}} onMouseOut={(e) => {this.setAuthorVisible(e, false)}} onInput={(e) => {this.reduceTitleSize(e)}} onKeyUp={(e) => {this.reduceTitleSize(e)}} onKeyDown={(e) => {this.reduceTitleSize(e)}} rows="1" name="upl-article-title" placeholder="title" autoComplete="off"></TextareaAutosize>
                        <div className={cookies.get('loggedIn') && !this.state.published ? "write-article-author prompt-basic-s grey-out-hide" : "write-article-author hidden"} ref={this.byAuthor}>by {this.props.isLoggedIn}</div>
                        <CKEditor
                            editor={ ckEditor }
                            config={{
                                placeholder:this.randomProperty(this.placeholders)
                            }}
                            onInit={ editor => {
                                // You can store the "editor" and use when it is needed.
                                this.editor = editor;
                                document.getElementsByClassName('ck-sticky-panel__content')[0].style.visibility = "hidden";
                                //console.log( 'Editor is ready to use!', editor );
                            } }
                            onChange={ ( event, editor ) => {
                                const data = editor.getData();
                                // console.log( { event, editor, data } );
                            } }
                            onBlur={ ( event, editor ) => {
                                    this.catchBlur(2);
                                //console.log( 'Blur.', editor );
                            } }
                            onFocus={ ( event, editor ) => {
                                document.getElementsByClassName('ck-sticky-panel__content')[0].style.visibility = "visible";
                                //console.log( 'Focus.', editor );
                            } }
                        />
                        <div className={this.state.responseTitle ? "response-title prompt-basic grey-out" : "hidden"}>Responding to <Link to={{ pathname:`/watch?v=${this.state.responseMpd}`}}>{this.state.responseTitle}</Link></div>
                        <Button className={!this.state.published ? "publish-button publish-button-article" : "publish-button publish-button-article publish-button-hidden"} onClick={(e) => {this.publishArticle(e)}}>Publish</Button>
                    </div>
                    <div className={this.state.published ? "prompt-basic publish-confirmed" : "prompt-basic publish-confirmed publish-confirmed-hidden"}>Your article was published, view it here</div>
                </div>
            </div>
        )
    }
}
