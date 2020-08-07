import React, {Component} from 'react';
import CKEditor from '@ckeditor/ckeditor5-react';
// import inlineEditor from '@ckeditor/ckeditor5-build-inline';
import ckEditor from 'ckeditor5-custom-build';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import $ from 'jquery';

// Plugins not working: WordCount, Mention, Table, TableToolbar, Image, ImageCaption, Autoformat, CkFinderUploadAdapter, ImageToolbar
ckEditor.defaultConfig = {
    toolbar: ['heading', '|', 'Bold', 'Italic', 'Link', 'UnderLine', 'Strikethrough', 'Highlight', '|', 'Indent', 'Outdent', 'Alignment', '|', 'Superscript', 'Subscript', 'BlockQuote', 'Code', 'CodeBlock', 'BulletedList', 'NumberedList', 'Horizontalline', 'RemoveFormat']
}
export default class writeArticle extends Component {
    constructor(props) {
        super(props)
        this.state = {

        }
        this.placeholders = {
            somethingToSay: 'Got something to say? Write it here'
        }
    }

    componentDidMount() {
        console.log(ckEditor.builtinPlugins.map( plugin => plugin.pluginName ));
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
        if (!$.contains(document.getElementsByClassName('ck-editor')[0], e.target)) {
            if (document.getElementsByClassName('ck-sticky-panel__content')[0]) {
                document.getElementsByClassName('ck-sticky-panel__content')[0].style.visibility = "hidden";
            }
        }
    }

    randomPlaceholder() {

    }

    render() {
        return (

            <div>
                <div className="editor-container">
                <div className="write-an-article-prompt">Write an article</div>
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
                            console.log( 'Blur.', editor );
                        } }
                        onFocus={ ( event, editor ) => {
                            document.getElementsByClassName('ck-sticky-panel__content')[0].style.visibility = "visible";
                            console.log( 'Focus.', editor );
                        } }
                    />
                </div>
            </div>
        )
    }
}
