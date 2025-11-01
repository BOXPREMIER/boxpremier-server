import OrderModel from '../models/OrderModel.js';
import { handleError, handleSuccess } from '../utils/handleResponse.js';

export const getBoxesByType = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        const match = {};
        if (status) match.status = status;
        if (startDate || endDate) {
            match.orderDate = {};
            if (startDate) match.orderDate.$gte = new Date(startDate);
            if (endDate) match.orderDate.$lte = new Date(endDate);
        }

        const pipeline = [];
        if (Object.keys(match).length > 0) {
            pipeline.push({ $match: match });
        }
        pipeline.push({
            $group: {
                _id: '$boxType',
                total: { $sum: 1 }
            }
        });

        const result = await OrderModel.aggregate(pipeline);
        const formatted = result.reduce((acc, item) => {
            acc[item._id] = item.total;
            return acc;
        }, {});

        return handleSuccess(res, formatted, 'Boxes by type retrieved successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const getWinesByType = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        const match = {};
        if (status) match.status = status;
        if (startDate || endDate) {
            match.orderDate = {};
            if (startDate) match.orderDate.$gte = new Date(startDate);
            if (endDate) match.orderDate.$lte = new Date(endDate);
        }

        const pipeline = [];
        if (Object.keys(match).length > 0) {
            pipeline.push({ $match: match });
        }
        pipeline.push({
            $group: {
                _id: '$wineType',
                totalBottles: { $sum: '$boxSize' }
            }
        });

        const result = await OrderModel.aggregate(pipeline);
        const formatted = result.reduce((acc, item) => {
            acc[item._id] = item.totalBottles;
            return acc;
        }, {});

        return handleSuccess(res, formatted, 'Wines by type retrieved successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const getBoxesByWineType = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        const match = {};
        if (status) match.status = status;
        if (startDate || endDate) {
            match.orderDate = {};
            if (startDate) match.orderDate.$gte = new Date(startDate);
            if (endDate) match.orderDate.$lte = new Date(endDate);
        }

        const pipeline = [];
        if (Object.keys(match).length > 0) {
            pipeline.push({ $match: match });
        }
        pipeline.push({
            $group: {
                _id: '$wineType',
                totalBoxes: { $sum: 1 }
            }
        });

        const result = await OrderModel.aggregate(pipeline);
        const formatted = result.reduce((acc, item) => {
            acc[item._id] = item.totalBoxes;
            return acc;
        }, {});

        return handleSuccess(res, formatted, 'Boxes by wine type retrieved successfully');
    } catch (error) {
        return handleError(res, error);
    }
};

export const exportOrdersCSV = async (req, res) => {
    try {
        const orders = await OrderModel.find()
            .populate('userId', 'firstName lastName email')
            .populate('subscriptionId', 'boxType wineType')
            .sort({ orderDate: -1 });

        const csvHeader = 'Order ID,User Name,User Email,Box Type,Wine Type,Box Size,Full Name,Phone,Address,Postal Code,City,Province,Country,Status,Tracking Number,Carrier,Order Date,Shipped Date,Delivered Date,Total Amount\n';

        const csvRows = orders.map(order => {
            const address = `${order.street} ${order.number}${order.floor ? ' ' + order.floor : ''}`;
            return [
                order._id,
                order.userId ? `${order.userId.firstName} ${order.userId.lastName}` : 'N/A',
                order.userId ? order.userId.email : 'N/A',
                order.boxType,
                order.wineType,
                order.boxSize,
                order.fullName,
                order.phone,
                address,
                order.postalCode,
                order.city,
                order.province,
                order.country,
                order.status,
                order.trackingNumber || 'N/A',
                order.carrier || 'N/A',
                order.orderDate.toISOString().split('T')[0],
                order.shippedDate ? order.shippedDate.toISOString().split('T')[0] : 'N/A',
                order.deliveredDate ? order.deliveredDate.toISOString().split('T')[0] : 'N/A',
                order.totalAmount
            ].join(',');
        }).join('\n');

        const csv = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
        return res.status(200).send(csv);
    } catch (error) {
        return handleError(res, error);
    }
};