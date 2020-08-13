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
    NavLink
} from 'react-router-dom';
import $ from 'jquery';

// Plugins not working: WordCount, Mention, Table, TableToolbar, Image, ImageCaption, Autoformat, CkFinderUploadAdapter, ImageToolbar
ckEditor.defaultConfig = {
    toolbar: ['heading', '|', 'Bold', 'Italic', 'UnderLine', 'Strikethrough', 'Highlight', 'Link', '|', 'Indent', 'Outdent', 'Alignment', '|', 'Superscript', 'Subscript', 'BlockQuote', 'Code', 'CodeBlock', 'BulletedList', 'NumberedList', 'Horizontalline', 'RemoveFormat', 'Emoji']
}
ckEditor.editorUrl= "../editor/ckeditor4/ckeditor.js";

export default class writeArticle extends Component {
    constructor(props) {
        super(props)
        this.state = {
            published: false, currentErr: ""
        }
        this.placeholders = {
            somethingToSay: 'Got something to say? Write it here'
        }
    }

    componentDidMount() {
        // console.log(ckEditor.builtinPlugins.map( plugin => plugin.pluginName ));
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

    publishArticle() {
        if (this.props.isLoggedIn && !this.state.published) {
            const username = this.props.isLoggedIn;
            fetch(currentrooturl + 'm/publisharticle', {
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
            .then((response) => {
                return response.json(); // Parsed data
            })
            .then((data) => {
                if (data.querystatus == "article posted") {
                    this.setState({published: true});
                }
                console.log(data);
            })
        }
    }

    randomPlaceholder() {

    }

    render() {
        return (

            <div>
                <div className="editor-container">
                    <div className="write-an-article-prompt">Write an article</div>
                    <div className={this.state.currentErr ? "article-err-status" : "article-err-status hidden"}>{this.state.currentErr > 0 ? this.props.currentErr : ""}</div>
                    {!this.props.isLoggedIn ? <div className="prompt-basic grey-out">You are not logged in please log in to write an article</div> : null}
                    <div className={this.props.isLoggedIn && !this.state.published ? "write-article-editor-container" : "write-article-editor-container hidden"}>
                        <input type='text' id="upl-article-title" className="fixfocuscolor" ref={this.titleIn} name="upl-article-title" placeholder="title" autoComplete="off"></input>
                        <CKEditor
                            editor={ ckEditor }
                            config={{
                                placeholder:this.randomProperty(this.placeholders)
                            }}
                            onInit={ editor => {
                                // You can store the "editor" and use when it is needed.
                                document.getElementsByClassName('ck-sticky-panel__content')[0].style.visibility = "hidden";
                                console.log( 'Editor is ready to use!', editor );
                            } }
                            onChange={ ( event, editor ) => {
                                const data = editor.getData();
                                console.log( { event, editor, data } );
                            } }
                            onBlur={ ( event, editor ) => {
                                    this.catchBlur(2);
                                console.log( 'Blur.', editor );
                            } }
                            onFocus={ ( event, editor ) => {
                                document.getElementsByClassName('ck-sticky-panel__content')[0].style.visibility = "visible";
                                console.log( 'Focus.', editor );
                            } }
                        />
                        <Button className={!this.state.published ? "publish-button publish-button-article" : "publish-button publish-button-article publish-button-hidden"} onClick={(e) => {this.publishArticle(e)}}>Publish</Button>
                    </div>
                    <div className={this.state.published ? "prompt-basic publish-confirmed" : "prompt-basic publish-confirmed publish-confirmed-hidden"}>Your article was published, view it here</div>
                </div>
            </div>
        )
    }
}
