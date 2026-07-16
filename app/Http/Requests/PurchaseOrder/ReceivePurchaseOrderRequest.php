<?php

namespace App\Http\Requests\PurchaseOrder;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReceivePurchaseOrderRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * That a line belongs to this order, and that the quantity does not exceed what
     * was ordered, are checked in the service where the line is already loaded.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'lines' => ['present', 'array'],
            'lines.*.purchase_detail_id' => ['required', Rule::exists('purchase_details', 'id')],
            'lines.*.received_qty' => ['required', 'numeric', 'min:0'],
        ];
    }
}
