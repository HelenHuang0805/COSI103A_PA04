/*
    transaction.js -- Router for Transaction
*/
const express = require('express');
const router = express.Router();
const moment = require('moment');
const transactionItem = require('../models/Transaction')
const mongoose = require('mongoose');

isLoggedIn = (req, res, next) => {
    if (res.locals.loggedIn) {
        next()
    } else {
        res.redirect('/login')
    }
}

// get the value associated to the key
// display transaction records and sort by selected option
router.get('/transaction/',
    isLoggedIn,
    async (req, res, next) => {
        const sortBy = req.query.sortBy || 'date'; // default sort option
        let transactions = [];

        try {
            // retrieve transactions from database
            transactions = await transactionItem.find({
                userId: req.user._id
            });

            // sort transactions by selected option
            switch (sortBy) {
                case 'category':
                    transactions.sort((a, b) => a.category.localeCompare(b.category));
                    break;
                case 'amount':
                    transactions.sort((a, b) => a.amount - b.amount);
                    break;
                case 'description':
                    transactions.sort((a, b) => a.description.localeCompare(b.description));
                    break;
                case 'date':
                default:
                    transactions.sort((a, b) => b.date - a.date);
                    break;
            }
        } catch (error) {
            console.error(error);
        }

        // render the transaction page with sorted transactions
        res.render('transaction', {
            transactions,
            sortBy
        });
    });


/* add the value in the body to the list associated to the key */
router.post('/transaction',
    isLoggedIn,
    async (req, res, next) => {
        const transaction = new transactionItem({
            amount: parseFloat(req.body.amount),
            category: req.body.category,
            date: moment(req.body.date, 'YYYY-MM-DD').toDate(),
            description: req.body.description,
            userId: req.user._id
        });
        await transaction.save();
        res.redirect('/transaction')
    });

router.get('/transaction/remove/:transactionId',
    isLoggedIn,
    async (req, res, next) => {
        console.log("inside /transaction/remove/:transactionId")
        await transactionItem.deleteOne({
            _id: req.params.transactionId
        });
        res.redirect('/transaction')
    });

router.get('/transaction/edit/:transactionId',
    isLoggedIn,
    async (req, res, next) => {
        const transaction = await transactionItem.findById(req.params.transactionId);
        res.render('editTransaction', {
            item: transaction
        });
    });

router.post('/transaction/update',
    isLoggedIn,
    async (req, res, next) => {
        const {
            itemId,
            description,
            category,
            amount,
            date
        } = req.body;
        console.log("inside /transaction/update:itemId");
        await transactionItem.findOneAndUpdate({
            _id: itemId
        }, {
            $set: {
                description,
                category,
                amount,
                date
            }
        });
        res.redirect('/transaction')
    });

router.get('/transaction/summary', isLoggedIn, async (req, res, next) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);

        const results = await transactionItem.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: "$category", total: { $sum: "$amount" } } },
            { $sort: { _id: 1 } }
        ]);

        res.render('transSummary', {
            title: 'Transaction Summary',
            results
        });
    } catch (err) {
        next(err);
    }
    });
    
    

module.exports = router;