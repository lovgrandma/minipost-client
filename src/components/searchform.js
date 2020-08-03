import React, {Component} from 'react';
import search from '../static/search.svg';

// Searchform within navbar
export default class SearchForm extends Component {
    constructor(props) {
        super();
        this.searchTermRef = React.createRef();
    }

    hoverShow = (e, name, enterexit) => {
        if (name == "search") {
            if (enterexit == "enter") {
                document.querySelector(".btn-desc-search").classList.add("visible");
            } else if (enterexit == "exit") {
                document.querySelector(".btn-desc-search").classList.remove("visible");
            }
        }
    }

    render() {
        return (
            <form className="search-form-flex" method="GET" action="/search">
                <input className="search-field" id="search" type="search" ref={this.searchTermRef} placeholder="Search.." name="s"></input>
                <button className="searchbox" type="submit" value="submit" onMouseOver={(e) => {this.hoverShow(e, "search", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "search", "exit")}}>
                    <i className="material-icons search material-icon-search">search</i>
                    <div className="btn-desc btn-desc-search">search</div>
                </button>
            </form>
        );
    }
};
