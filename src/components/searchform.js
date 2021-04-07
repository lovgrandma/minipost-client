import React, {Component} from 'react';
import history from '../methods/history.js';

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

    // This will eventually be used to stop the page from refreshing when search occurs
    // Page will load new results without refreshing page
    handleSearch = (e) => {
//        e.preventDefault();
//        history.push('/search?s=yup');
    }

    render() {
        return (
            <form className="search-form-flex" method="GET" action="/search" onSubmit={(e) => {this.handleSearch(e)}}>
                <input className="search-field" id="search" type="search" ref={this.searchTermRef} placeholder="Search.." name="s"></input>
                <button className="searchbox" type="submit" value="submit" onMouseOver={(e) => {this.hoverShow(e, "search", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "search", "exit")}}>
                    <i className="material-icons search material-icon-search">search</i>
                    <div className="btn-desc btn-desc-search">search</div>
                </button>
            </form>
        );
    }
};
