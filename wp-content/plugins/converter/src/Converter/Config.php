<?php

namespace ATDev\Tools\Converter;

class Config {
	protected string $_dir;
	protected object $_data;

	public function __construct( string $dir ) {
		$this->_dir = $dir;
	}

	public function load( string $name ): self {
		$this->_data = require sprintf( "%s/configs/%s.php", $this->_dir, $name );

		return $this;
	}

	public function __get( string $key ): ?object {
		return $this->_data->$key;
	}

	public function __set( string $key, $value ): void {
		throw new \RuntimeException( 'Not implemented' );
	}

	public function __isset( string $key ): bool {
		return ! empty( $this->_data->$key );
	}

	public static function create( string $dir ): self {
		return new self( $dir );
	}
}