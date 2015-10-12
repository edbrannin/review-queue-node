var singletons = {
};

//TODO Put this back into the Component and register it into singletons
var TagFilter = React.createClass({
    addTag: function(tag) {
        tags = this.state.tags;
        if (tags.indexOf(tag) == -1) {
            tags = tags.concat([tag]);
        }
        this.setState({tags: tags});
        //TODO Event Dispatch wanted
        if (singletons.updateQueue) {
            singletons.updateQueue(tags);
        }
    },
    getInitialState: function() {
        return {tags: []};
    },
    componentDidMount: function() {
        singletons.filter = this;
    },
    render: function() {
        var tags = this.state.tags;
        return (
            <ul className="tagFilter">
                {tags.map(function(tag) {
                    return (
                        <li key={tag}>{tag}</li>
                    );
                })}
            </ul>
       );
    }
});


var BulkTagger = React.createClass({
    getInitialState: function() {
        return { items: [] };
    },
    addItem: function(item) {
        var items = this.state.items;
        if (items.indexOf(item) == -1) {
            this.setState({ items: items.concat([item]) });
        }
    },
    removeItems: function(items) {
        var remove_item_ids = items.map( function(i) { return i.id; });
        this.setState({ items: this.state.items.filter(
            function(i) { return remove_item_ids.indexOf(i.id) == -1; }) });
    },
    removeItem: function(item) {
        this.setState({ items: this.state.items.filter(
            function(i) { return i.id != item.id; }) });
    },
    componentDidMount: function() {
        singletons.tagger = this;
    },
    render: function() {
        var selected = this.state.items;
        return (<div className="bulkTagger">
                <ul>
                {selected.map(function(item) { return (
                    <li key={item.id}>{item.name}</li>
                ); })}
                </ul>
                <TagButtons />
               </div>);
    }
});


var TagButtons = React.createClass({
    render: function() {
        var tags = ["Keep", "Backlog", "Delete"];
        var item = this.props.item;
        return (
            <ul className="add_tag">{
                tags.map( function(tag) {
                    return (
                        <li key={tag}><TagButton item={item} tag={tag}/></li>
                    );
                })
            }</ul>
        )
    }
});

var TagButton = React.createClass({
    form_action: "/tag_items",
    submitNewTag: function(e) {
        e.preventDefault();
        data = []
        var item = this.props.item;
        var tag = this.props.tag;
        var items = [item];
        var tags = [tag];
        var willClear = false;
        if (item == undefined) {
            items = singletons.tagger.state.items;
            willClear = true;
        }
        //Only one tag at a time, for now...
        if (tag == undefined) {
            console.log("submitNewTag(): tag is undefined!");
            return;
        }
        console.log("TODO: POST", this.form_action, "items=", items, "tag=", tags);
        if (tags.length == 0 || items.length == 0) {
            return;
        }
        for (i in tags) {
            data.push( { name: "tag", value: tags[i] } );
        }
        for (i in items) {
            data.push( { name: "item", value: items[i].id } );
        }

        console.log("POSTing to tag_items with data:", data);
        var result = jQuery.post("/tag_items", data,
            function() {
                if (singletons.updateQueue) {
                    console.log("Data Refresh!");
                    singletons.updateQueue();
                }
            });

        //Remove any newly-tagged items from the Bulk Tagger
        singletons.tagger.removeItems(items);

        return result;
    },
    render: function() {
        var tag = this.props.tag;
        var item = this.props.item;
        return (
            <form onSubmit={this.submitNewTag}
                    action={this.form_action} method="post">
                <input type="submit" className="submit" value={tag} name={tag} />
            </form>
        );
    }
});

var Tag = React.createClass({
    handleClick: function() {
        console.log("Clicked on tag:", this.props.name);
        if (singletons.filter) {
            singletons.filter.addTag(this.props.name);
        }
    },
    render: function() {
        var tag = this.props.name;
        return (
            <li key={tag} onClick={this.handleClick}>{tag}</li>
        )
    }
});

var QueueItem = React.createClass({
    getInitialState: function() {
        return { checked: false };
    },
    handleClick: function() {
        var newValue = !this.state.checked;
        this.setState({checked: newValue });
        if (singletons.tagger) {
            if (newValue) {
                singletons.tagger.addItem(this.props.item);
            } else {
                singletons.tagger.removeItem(this.props.item);
            }
        }
    },
    render: function() {
        var item = this.props.item
        var size = item.size_compressed_bytes
        // Try number.toFixed(digits)
        var size_kb = Math.floor(size/1024)
        var size_mb = Math.floor(size_kb/1024)
        size_kb -= size_mb * 1024

        var tagNodes = item.tags.map( function(tag) {
            return (
                <Tag key={tag} name={tag} />
            );
        });
        //FIXME Get this from the server
        var tag_buttons = ["Keep", "Backlog", "Delete"].map( function(tag) {
            return (
                <li key={tag}><TagButton item={item} tag={tag}/></li>
            );
        });
        var cardClass = "card checked-" + this.state.checked
        return (
            <li className={cardClass} >
                <img className="icon icon-57"
                    src={item.links.softwareIcon57x57URL}
                    onClick={this.handleClick} />
                <div className="size">{size_mb}.{size_kb} MB</div>
                <div className="name">
                <a href={item.url}>{item.name}</a>
                </div>
                <ul className="tags">{tagNodes}</ul>
                <TagButtons item={item} />
            </li>
        );
    }
});

var ReviewQueue = React.createClass({
    updateQueue: function(force_tags) {
        url = this.props.url;
        var tags = []
        if (force_tags) {
            tags = tags.concat(force_tags)
        }
        if (singletons.filter) {
            tags = tags.concat(singletons.filter.state.tags);
        }
        console.log("Loading Queue with tags", tags);
        $.ajax({
            url: url,
            data: tags.map(function(tag) { return { name: "tag", value: tag }; } ),
            dataType: 'json',
            success: function(items, arg2) {
                this.setState({items: items});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(url, status, err.toString());
            }.bind(this)
        });
    },
    getInitialState: function() {
        return {items: []};
    },
    componentDidMount: function() {
        singletons.updateQueue = this.updateQueue;
        singletons.updateQueue();
    },
    render: function() {
        var itemNodes = this.state.items.map(function(item) {
            return (<QueueItem item={item} key={item.id} />)
        });
        return (
            <div className="review-queue">
                <h2>Queue</h2>
                <ul className="queue">
                    {itemNodes}
                </ul>
                <BulkTagger />
                <TagFilter />
            </div>
        );
    }
});


React.render(
    <ReviewQueue url="/queue.json" />,
    document.getElementById('content')
);
