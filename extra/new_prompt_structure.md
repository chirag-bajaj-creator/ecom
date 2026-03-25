<!--  prompt for user as admin -->

TASK:
Create an user admin Basically the meaning is it will become a marketplace the current website is that the admin put their products but there is no option for user to add products to the website 

CONTEXT :
The website is an online marketplace where users can browse products search items and do the various things and the admin add the product to the website so that it can get and see the product through the user The one option which I have to add is user as the it should have user as the admin to give it a capability to add the product

what capabilties to have 

User as the admin should have the capability to add the product by two or three methods
It should be the method Same method which is being taken for the admin
1) add product (Single product)
2) Add by Json
3) And delete all products method method
4) User adds the admin should have the rights to see where his or her product has reached 

OUTPUT :
Output of this feature
1) Wanted the user as the admin dashboard which should have a separate NAV bot and the NAV bar there should be the three things 
- products
- delivery boy status 
- contact admin page On which there should be the phone number of the admin
- add login option for user as admin and the invite code also as user-admin-2025 
2) product Button of the NAV should redirect to the page where in which there should be three buttons on the top on the top right add product add product by Jason and delete all products and there should be when we add the products by any of the two methods add by products or add by jason there should be a table which should have the fields
mage	Name	Category	Price	Stock	Actions(edit,delete buttons for single product)
3) Now the add product (Single product)
Should open a form add products first write category name and another field is 
- no of products per category 
- then after no of products per category How many the product there should be the separate form of each product containing the field 
Name

Description

Price (₹)

Stock

Image URL

Product Details (Dropdowns) = Basically the users of this button this is the product details which is to be updated on the page when the person clicks the single product which is the field there on the user page you should have the reference to the user page 

+ Add Dropdown this si the button



- add by json While adding a product by Jason which is the method to add the bulk which is the method to add the products in the bulk it should follow format
```
Expected format:
[
  {
    "category": "Category Name",
    "products": 2,
    "productsList": [
      { "name": "...", "description": "...", "price": 999, "stock": 50, "imageUrl": "..." },
      { "name": "...", "description": "...", "price": 499, "stock": 30, "imageUrl": "..." }
    ]
  }
]
```

- And then delete all button is to delete all the products at the one go

4) Now for the Delivery Boy status dashboard on the Delivery Boy status dashboard it should show where the currently delivery boy status is is the product shipped is the product currently in queue or is the product delivered It should have the found to show



5) Now the last one which I want from the output is to have the pop up when the person clicks on the admin contact button which should show the email of the admin and the contact number for the help of the user as the admin to contact the admin in case of any query




For the design query of the this page you have to the below image in the workspace
C:\Users\CHIRAG BAJAJ\OneDrive\AppData\Desktop\ecommerce_structure-main\image copy.png