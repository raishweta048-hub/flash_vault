# flash_vault
A system designed to support flash sales and prevent overselling when thousands of customers attempt to purchase a limited product simultaneously.

## Problem Statement:
Flash sales attract extremely high traffic within seconds of a product launch.  
When thousands of users attempt to purchase a limited item simultaneously, poorly designed systems may allow:

1. Inventory counts to become negative
2. Multiple users to purchase the same item
3. Payments to be processed for products that are already sold out

These issues create inconsistencies and poor user experience during high-demand product drops.

## Key Features

- Flash-sale ready purchase system  
- Inventory protection mechanism  
- Handles simultaneous checkout attempts  
- Prevents overselling of products  
- Clean **“Sold Out”** response when inventory finishes

## System Architecture

User → React Frontend → Express Backend API → Inventory Check → Order Confirmation / Sold Out

The backend verifies inventory availability before confirming a purchase.  
If stock is available, the order is processed and inventory is reduced.  
If stock is unavailable, the system rejects the purchase request.

## Tech Stack

Frontend  
- React

Backend  
- Node.js  
- Express.js  

Database  
- MongoDB

## Demo Scenario

Inventory = 5 units

If 20 users attempt to purchase simultaneously:

- The first 5 purchases succeed
- Remaining users receive a **“Sold Out”** response

This ensures the system never allows inventory to drop below zero.

## Future Improvements

- Implement a queue-based checkout system
- Add rate limiting to prevent bot traffic
- Use distributed locking for large scale systems
- Real-time monitoring during flash sales



