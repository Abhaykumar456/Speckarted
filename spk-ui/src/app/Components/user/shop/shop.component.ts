import { Component, OnInit } from '@angular/core';
import { ProductModel, Cart, ImageDataModel, CartProduct } from 'src/app/Models/spk.model';
// tslint:disable-next-line: semicolon
import { ProductModelClass } from 'src/app/Models/Class/cart.class';
import { ApiService } from 'src/app/Services/api/api.service';
// tslint:disable-next-line: semicolon
// tslint:disable-next-line: semicolon
import { Web3Service } from 'src/app/Services/Web3/web3.service';
import { Router } from '@angular/router';
import { Web3Model } from 'src/app/Models/web3.model';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit {

  account: string
  spk: any
  imgurl = 'http://0.0.0.0:3000/'
  products: ProductModel[] = []
  productDetail: ProductModel = new ProductModelClass()
  cart: Cart

  constructor(private api: ApiService, private web3service: Web3Service, private route: Router) {
    if (sessionStorage.getItem('cart') === null) {
      this.cart = { productData: [], cartTotal: 0 }
    } else {
      this.cart = JSON.parse(sessionStorage.getItem('cart'))
    }
  }
  ngOnInit() {
    this.web3service.web3login()
    this.web3service.Web3Details$.subscribe(async (data: Web3Model) => {
      this.account = data.account
      this.spk = data.spk
    })
    this.onLoad()
  }
  onLoad = async () => {
    try {
      const totalProducts = await this.spk.totalProductID().call({ from: this.account })
      for (let i = 100; i < totalProducts; i++) {
        const temProduct: ProductModel = await this.spk.product(i).call({ from: this.account })
        temProduct.itemId = i
        const imgs: any = await this.api.viewProducts(temProduct.imageId)
        temProduct.imageData = new Array()
        imgs.forEach((img: ImageDataModel, i: any) => {
          temProduct.imageData[i] = img
        })
        this.products.push(temProduct)
        console.log("TCL: ShopComponent -> onLoad -> this.products", this.products)
      }
    } catch (error) {
    }
  }
  detailView = async (product: ProductModel) => {
    this.productDetail = product
    const recentView: any = await this.api.recentView(product, this.account)
    console.log("TCL: ShopComponent -> detailView -> recentView", recentView)
  }
  addToCart = async (product: ProductModel) => {
    const itemCart: CartProduct = {
      itemId: null,
      itemName: null,
      itemCount: null,
      itemPrice: null,
      itemTotal: null,
      imageId: null,
      imageData: []
    }
    itemCart.itemId = product.itemId
    itemCart.itemName = product.itemName
    itemCart.itemCount++
    itemCart.itemPrice = product.itemPrice
    itemCart.itemTotal = itemCart.itemPrice * itemCart.itemCount
    itemCart.imageId = product.imageId
    itemCart.imageData = product.imageData
    console.log("TCL: ShopComponent -> addToCart -> itemCart", itemCart)

    const len = this.cart.productData.length

    let flag = 0
    for (let i = 0; i < len; i++) {
      if (this.cart.productData[i].itemId === product.itemId) {
        flag = 1
        this.cart.productData[i].itemCount++
        this.cart.productData[i].itemTotal = product.itemPrice * this.cart.productData[i].itemCount
      }
    }
    if (flag !== 1) {
      this.cart.productData.push(itemCart)
    }
    this.cart.cartTotal = this.cart.cartTotal + parseInt(product.itemPrice, 10)
    alert('Your item is added to the cart')
    sessionStorage.setItem('cart', JSON.stringify(this.cart))
  }
  clearProduct = async () => {
    this.productDetail = new ProductModelClass()
  }
  logOut = async () => {
    sessionStorage.clear()
    this.route.navigateByUrl('/')
  }

}
