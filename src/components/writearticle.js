import React, {Component} from 'react';
import CKEditor from '@ckeditor/ckeditor5-react';
//import inlineEditor from '@ckeditor/ckeditor5-build-inline';
import ckeditor from 'ckeditor5-custom-build';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';

ckeditor.defaultConfig = {
    toolbar: ['heading', '|', 'Bold', 'Italic', 'Link', '|', 'Code', 'CodeBlock', 'Indent', 'Table', 'Highlight', 'Mention', 'BulletedList', 'NumberedList', '|', 'Image']
}
export default class writeArticle extends Component {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    componentWillMount() {
        console.log(ckeditor.builtinPlugins.map( plugin => plugin.pluginName ));
    }

    render() {
        return (

            <div>
                <div className="write-an-article-title">Write an article</div>
               <CKEditor
                    editor={ ckeditor }
                    data="<p>Got something to say?</p>"
                    onInit={ editor => {
                        // You can store the "editor" and use when it is needed.
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
                        console.log( 'Focus.', editor );
                    } }
                />
            </div>
        )
    }
}
