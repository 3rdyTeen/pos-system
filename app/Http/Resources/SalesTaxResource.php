<?php

namespace App\Http\Resources;

use App\Models\SalesTax;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SalesTax
 */
class SalesTaxResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sale_id' => $this->sale_id,
            'sales_detail_id' => $this->sales_detail_id,
            'tax_id' => $this->tax_id,
            /** Copied off the tax when the sale was rung up, so a later rate change does not rewrite history. */
            'tax_name' => $this->tax_name,
            'rate' => $this->rate,
            'taxable_amount' => $this->taxable_amount,
            'tax_amount' => $this->tax_amount,
        ];
    }
}
