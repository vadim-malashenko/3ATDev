<?php

namespace ATDev\Tools\Converter;

interface ApiInterface
{
    public function get_prices(array $params = []): ?object;
}