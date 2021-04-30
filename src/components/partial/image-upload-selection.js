import React, { Component } from "react";
import { cookies } from '../../App.js';
import {
    Button
} from 'react-bootstrap';
import { Callbacks } from "jquery";

export default class ImageUploadSelection extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cloud: "", selectedImg: "", waitingFiles: [], placeholderCtxIterator: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        };
        this.imgname = React.createRef();
        this.imgurl = React.createRef();
        this.uploadFiles = React.createRef();
    }

    componentDidMount() {
        if (cookies.get('contentDelivery')) {
            this.setState({ cloud: cookies.get('contentDelivery')});
        }
    }

    handleImgUpload = () => {
        if (this.props.editing == "dummy") {
            if (this.uploadFiles.current) {
                if (this.uploadFiles.current.files) {
                    let cachedImages = this.state.waitingFiles;
                    let tempImgData = [];
                    for (let i = 0; i < this.uploadFiles.current.files.length; i++) {
                        cachedImages.push(this.uploadFiles.current.files[i]);
                        let url = URL.createObjectURL(this.uploadFiles.current.files[i]); 
                        tempImgData.push({name: "", url: url, file: this.uploadFiles.current.files[i]});
                        this.tryLoadCacheImg(i, url);
                    }
                    this.setState({ waitingFiles: cachedImages});
                    this.props.sendTempImgData(tempImgData);
                }
            }
        }
    }

    tryLoadCacheImg(index, url) {
        try {
            let canvas = document.getElementsByClassName("cached-img" + index)[0];
            let ctx = canvas.getContext("2d");
            ctx.fillRect(0,0, canvas.width, canvas.height);
            let img = new Image();
            // let reader = new FileReader();
            img.onload = function() {
                // Code below from @GameAlchemist at https://stackoverflow.com/questions/23104582/scaling-an-image-to-fit-on-canvas
                var canvas = ctx.canvas;
                var hRatio = canvas.width  / img.width;
                var vRatio =  canvas.height / img.height;
                var ratio  = Math.min ( hRatio, vRatio );
                var centerShift_x = ( canvas.width - img.width*ratio ) / 2;
                var centerShift_y = ( canvas.height - img.height*ratio ) / 2;  
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0,0, img.width, img.height, centerShift_x, centerShift_y,img.width * ratio, img.height * ratio);  
                canvas.setAttribute("imgdata", url); // Will store a reference to url to easily match urls for updating img name
            }
            img.src = url;
        } catch (err) {
            console.log(err);
            // Fail silently
        }
    }

    searchAndUpdateImgNamePrepare() {
        try {
            let name = "";
            if (this.imgname) {
                if (this.imgname.current) {
                    if (typeof this.imgname.current.value == "string") {
                        name = this.imgname.current.value;
                    }
                }
            }
            // SelectedImg should be a url 
            this.props.searchAndUpdateImgName(this.state.selectedImg, this.props.editing, name);
        } catch (err) {
            // Fail silently
        }
    }

    setCurrSelectedImg(num) {
        try {
            let selected = document.getElementsByClassName("cached-img" + num)[0];
            this.setState({ selectedImg: selected.getAttribute("imgdata") });
            this.imgname.current.value = "";
            if (this.imgname) {
                if (this.imgname.current) {
                    for (let i = 0; i < this.props.tempImgData.length; i++) {
                        if (selected.getAttribute("imgdata") == this.props.tempImgData[i].url) {
                            this.imgname.current.value = this.props.tempImgData[i].name;
                            break;
                        }
                    }
                }
            }
        } catch (err) {
            // Fail silently
        }
    }

    render() {
        return (
            <div>
                <div className="upload-product-images-container">
                    <div className="upload-product-images-meta">
                        <h5>Upload Product Images</h5>
                        <input type="file" id="file-upload-shop-img" name="file-upload-shop-img" className="margin-bottom-5" accept="image/png, image/jpeg, image/jpg" onChange={this.handleImgUpload} ref={this.uploadFiles} multiple></input>
                        <div className="info-blurb margin-bottom-5">Max 10 images per product</div>
                        <div>
                            <input type="text" ref={this.imgname} name="imgname" id="imgname" className="margin-bottom-5 img-product-name" placeholder="Name" onInput={(e) => {this.searchAndUpdateImgNamePrepare()}}></input>
                        </div>
                        <div className="info-blurb margin-bottom-5">Name your images after the style most appropriate for the image. If you have only have one style don't worry about naming</div>
                        {
                            this.props.editing == "dummy" ?
                                <div className="info-blurb">When you close this page remember to save this new product in order to upload the images to Minishops. Right now these images are only cached locally until the product is officially created. This only applies images for products that don't already exist in the database</div>
                                : null
                        }
                    </div>
                    <div className="upload-product-images-loaded">
                        {
                            this.props.images && this.props.editing != "dummy" ? 
                                this.props.images.map((image, index) => 
                                    <div url={image.url}><img src={this.state.cloud + "/" + image.url}></img></div>
                                )
                                : 
                                this.state.placeholderCtxIterator ?
                                    this.state.placeholderCtxIterator.map((num) =>
                                        <span className="cached-img-container">
                                            <canvas className={"cached-img cached-img" + num} height="380px" width="250px" onClick={(e) => {this.setCurrSelectedImg(num)}}></canvas>
                                        </span>
                                    )
                                    : null
                        }
                    </div>
                </div>
                <div className="image-upload-interact-button-container"><Button onClick={(e) => {this.props.toggleImagePortal(false)}}>Close</Button></div>
            </div>
        )
    }
}