const express = require('express');
const bodyParer = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParer.urlencoded({extended: true}));
app.use(express.static('public'));

mongoose.connect('mongodb+srv://admin-tony:dbpwd@todolist.vkkqo.mongodb.net/todolistDB');

/* Items Schema */
const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

/* Custom List Schema */
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

/* Default Items */
const item1 = new Item({
    name: "Welcome to your todolist"
});

const item2 = new Item({
    name: "Hit the + button to add a new item"
});

const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

app.get('/', (req, res) => {
    Item.find({}, (err, foundItems) => {

        if(foundItems.length === 0){
            Item.insertMany(defaultItems, (err) => {});
            res.redirect("/");
        }else{
            res.render('list', {listTitle: "Today", newListItems: foundItems});
        }
    });
});

app.get("/:listName", (req, res) => {
    const listName = _.capitalize(req.params.listName);

    List.findOne({name: listName}, (err, foundList) => {
        if(!err){
            if(!foundList){
                /* Creates a new list */
                const list = new List({
                    name: listName,
                    items: defaultItems
                });

                list.save();

                res.redirect("/" + listName);
            }else{
                /* Show an existing list */
                res.render('list', {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    });
});

app.post('/', (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name: listName}, (err, foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post('/delete', (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndDelete(checkedItemId, (err) => {
            if(!err){
                res.redirect("/");
            }
        });
    }else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
            if(!err){
                res.redirect("/" + listName);
            }
        });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server has been started");
});
