<?php

namespace ATDev\Tools\Converter;

class CoinMarket implements ApiInterface {
	private string $_url;
	private string $_key;

	public function __construct( object $config ) {
		$this->_url = $config->url;
		$this->_key = $config->key;
	}

	private function request( string $method, array $params ): string {
		$url   = "{$this->_url}/{$method}";
		$query = http_build_query( $params );

		$options = [
			CURLOPT_URL            => "{$url}?{$query}",
			CURLOPT_HTTPHEADER     => [ "Accepts: application/json", "X-CMC_PRO_API_KEY: {$this->_key}" ],
			CURLOPT_RETURNTRANSFER => 1
		];

		$curl = curl_init();
		curl_setopt_array( $curl, $options );
		$response = curl_exec( $curl );
		curl_close( $curl );

		if ( curl_errno( $curl ) > 0 ) {

			[ $code, $message ] = [ curl_errno( $curl ), curl_error( $curl ) ];
			$response = "{\"status\":{\"error_code\":\"{$code}\",\"error_message\":\"{$message}\"}}";
		}

		return $response;
	}

	public function get_prices( array $params = [] ): ?object {
		$method = 'listings/latest';
		$params += [ 'start' => 1, 'limit' => 5000, 'cryptocurrency_type' => 'coins' ];

		$response = $this->request( $method, $params );
		$response = json_decode( $response, 0, 512, JSON_THROW_ON_ERROR );

		$response = $response->status->error_code === 0
			? (object) [
				'list' => array_values( array_reduce(
					$response->data,
					static fn( array $r, $i ): array => $i->quote->USD->price > 0
						? $r + [
							$i->symbol => (object) [
								'id'     => $i->id,
								'symbol' => $i->symbol,
								'name'   => $i->name,
								'price'  => (float) $i->quote->USD->price
							]
						]
						: $r,
					[]
				) )
			]
			: $response->status;

		return $response;
	}
}