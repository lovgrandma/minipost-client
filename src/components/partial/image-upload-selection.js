import React, { Component } from "react";
import { cookies } from '../../App.js';
import {
    Button
} from 'react-bootstrap';

export default class ImageUploadSelection extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cloud: "", selectedImg: "", waitingFiles: [], placeholderCtxIterator: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], currSelectedImg: -1
        };
        this.imgname = React.createRef();
        this.uploadFiles = React.createRef();
    }

    componentDidMount() {
        if (cookies.get('contentDelivery')) {
            this.setState({ cloud: cookies.get('contentDelivery')});
        }
    }

    componentDidUpdate(prevProps) {
        try {
            if (prevProps.editing != this.props.editing && this.imgname.current.value != "") {
                this.imgname.current.value = ""; // Reset current naming
                currSelectedImg = -1; // Reset current selected img
            }
        } catch (err) {
            // fail silently
        }
    }

    /**
     * Will determine how image upload is handled based on index
     */
    handleImgUpload = () => {
        try {
            this.setState({ currSelectedImg: -1 });
            if (this.props.editing == "dummy") {
                this.clearAll();
                if (this.uploadFiles.current) {
                    if (this.uploadFiles.current.files) {
                        let cachedImages = this.state.waitingFiles;
                        let tempImgData = [];
                        for (let i = 0; i < this.uploadFiles.current.files.length; i++) {
                            cachedImages.push(this.uploadFiles.current.files[i]);
                            let url = URL.createObjectURL(this.uploadFiles.current.files[i]); 
                            tempImgData.push({name: "", url: url, file: this.uploadFiles.current.files[i]});
                            if (i > 8) {
                                break; // Only allow 10 images
                            }
                        }
                        this.setState({ waitingFiles: cachedImages});
                        this.props.sendTempImgData(tempImgData);
                    }
                }
            } else {
                // Upload all new images immediately to s3 and save on product record
                const maxTotalNewImages = 10 - this.props.images.length;
                let cachedImages = this.state.waitingFiles;
                let tempImgData = [];
                for (let i = 0; i < maxTotalNewImages && i < this.uploadFiles.current.files.length; i++) {
                    cachedImages.push(this.uploadFiles.current.files[i]);
                    let url = URL.createObjectURL(this.uploadFiles.current.files[i]);
                    tempImgData.push({ name: "", url: url, file: this.uploadFiles.current.files[i]});
                    this.tryLoadCacheImg(i, url);
                    if ( i > 8) {
                        break;
                    }
                }
                this.setState({ waitingFiles: cachedImages });
                this.props.sendTempImgData(tempImgData);
            }
        } catch (err) {
            // Fail silently
        }
    }

    /**
     * On new image upload, all images will be cleared
     */
    clearAll() {
        for (let i = 0; i < 10; i++) {
            try {
                let canvas = document.getElementsByClassName("cached-img" + i)[0];
                let ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            } catch (err) {
                // Fail silently
            }
        }
    }

    /**
     * Will attempt to load local images visually for dummy product in memory for display and name editing
     * @param {Number} index current image to load
     * @param {String} url local location of blob
     */
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
            // Fail silently
        }
    }

    /**
     * Will get name information in input and send new data to parent method that updates state
     */
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
            this.setState({ currSelectedImg: -1 });
            let selected = document.getElementsByClassName("cached-img" + num)[0];
            this.setState({ selectedImg: selected.getAttribute("imgdata") });
            this.imgname.current.value = "";
            if (this.imgname) {
                if (this.imgname.current) {
                    if (this.props.editing == "dummy") {
                        for (let i = 0; i < this.props.tempImgData.length; i++) {
                            if (selected.getAttribute("imgdata") == this.props.tempImgData[i].url) {
                                this.imgname.current.value = this.props.tempImgData[i].name;
                                this.setState({ currSelectedImg: i });
                                break;
                            }
                        }
                    } else {
                        for (let i = 0; i < this.props.images.length; i++) {
                            if (selected.getAttribute("imgdata") == this.props.images[i].url) {
                                this.imgname.current.value = this.props.images[i].name;
                                this.setState({ currSelectedImg: i });
                                break;
                            }
                        }
                    }
                }
            }
        } catch (err) {
            // Fail silently
        }
    }

    deleteThisImg = (e) => {
        try {
            if (this.props.deletions && this.props.editing != "dummy") {
                let tempDeletions = this.props.deletions;
                let index = this.props.editing;
                let match = false;
                if (tempDeletions.has(index)) {
                    let tempData = tempDeletions.get(index);
                    if (tempData.indexOf(this.props.images[this.state.currSelectedImg].url) == -1) {
                        tempData.push(this.props.images[this.state.currSelectedImg].url);
                        tempDeletions.set(index, tempData);
                    }
                } else {
                    tempDeletions.set(index, [ this.props.images[this.state.currSelectedImg].url ]);
                }
                this.props.setDeletions(tempDeletions);
            }
        } catch (err) {
            // Fail silently
        }
    }

    resolveMoveImg(e, index, dir = "left") {
        try {
            this.props.moveImg(this.props.editing, index, dir);
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
                        <div className="info-blurb-2 margin-bottom-10 weight600">Click on an image to choose a name for it. Name your images after the style most appropriate for the selected image. If you have only have one style don't worry about naming</div>
                        {
                            this.props.editing == "dummy" ?
                                <div className="info-blurb">These images are for a new product so when you close this page remember to save this new product in order to upload the images to Minishops. Right now these images are only cached locally until the product is officially created. This only applies to images for products that don't already exist in the database</div>
                                : null
                        }
                        {
                            this.props.editing != "dummy" && this.state.currSelectedImg > -1 ?
                                <div>
                                    <div><Button onClick={(e) => {this.deleteThisImg(e)}} className="delete-product-img-button prompt-basic-s2 grey-btn margin-bottom-5">Mark image for deletion</Button></div>
                                    <div className="prompt-basic-s2 grey-out">Click this button to mark the currently selected image for deletion. In order to finalize all deletes you'll need to save the product after you close this page</div>
                                </div>
                                : null
                        }
                    </div>
                    <div className="upload-product-images-loaded">
                        {
                            this.props.images && this.props.editing != "dummy" ? 
                                this.props.images.map((image, index) => 
                                    <span className="cached-img-container">
                                        <div className="mv-prd-image mv-prd-image-left" onClick={(e) => {this.resolveMoveImg(e, index, "left")}}>👈</div>
                                        <img className={this.state.currSelectedImg == index ? "cached-img cached-img-selected cached-img" + index : "cached-img cached-img" + index} src={this.state.cloud + "/" + image.url} onClick={(e) => {this.setCurrSelectedImg(index)}} index={index} key={index} imgdata={image.url}></img>
                                        <div className="mv-prd-image mv-prd-image-right" onClick={(e) => {this.resolveMoveImg(e, index, "right")}}>👉</div>
                                    </span>
                                )
                                : 
                                this.state.placeholderCtxIterator ?
                                    this.state.placeholderCtxIterator.map((num) =>
                                        <span className="cached-img-container">
                                            <canvas className={this.state.currSelectedImg == num ? "cached-img cached-img-selected cached-img" + num : "cached-img cached-img" + num} height="550px" width="350px" onClick={(e) => {this.setCurrSelectedImg(num)}}></canvas>
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