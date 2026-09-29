// DTO (Data Transfer Object): Khai báo cấu trúc dữ liệu Giỏ hàng mà Frontend gửi lên.

export class CreateOrderItemDto {
    productId: string;  // ID 
    size: 'S' | 'M' | 'L';  // Size
    qty: number;        // Số lượng ly
    toppings?: string[]; // Tên các topping (snapshot tại thời điểm đặt)
    lineTotal: number;  // Thành tiền dòng này (VND) - Backend sẽ kiểm tra lại
}

export class CreateOrderDto {
    items: CreateOrderItemDto[];  // Danh sách các món trong giỏ
    promoCode?: string;           // Mã giảm giá (nếu có)
}
