<?php

namespace ATDev\Tools\Converter;

class Plugin {
	public static string $name = 'converter';
	protected string $_file;
	protected ApiInterface $_api;

	public function __construct( string $dir, ApiInterface $api ) {
		$this->_file = sprintf( "%s/%s.php", $dir, static::$name );
		$this->_api  = $api;

		\register_uninstall_hook( $this->_file, [ static::class, 'uninstall' ] );
		\add_action( 'init', [ $this, 'init' ] );
	}

	public function init(): void {
		$this->registerAction();
		$this->registerScript();

		\add_filter( 'the_content', function ( $content ) {
			return ( \is_home() || \is_front_page() ) ? $this->view( static::$name ) . $content : $content;
		} );
	}

	public function registerAction(): void {
		\add_action( sprintf( "wp_ajax_%s", static::$name ), [ $this, 'ajax' ] );
		\add_action( sprintf( "wp_ajax_nopriv_%s", static::$name ), [ $this, 'ajax' ] );
	}

	public function registerScript(): void {
		$assets        = \plugin_dir_url( $this->_file ) . "assets";
		$bootstrap_css = "{$assets}/styles/dist/bootstrap.min.css";
		$bootstrap_js  = "{$assets}/scripts/dist/bootstrap.min.js";
		$converter_js  = "{$assets}/scripts/src/Converter/index.js";

		$l10n = [
			'url'    => \admin_url( 'admin-ajax.php' ),
			'action' => static::$name,
			'nonce'  => \wp_create_nonce( static::$name ),
			'id'     => static::$name
		];

		\wp_register_style( 'bootstrap5', $bootstrap_css, [], false );
		\wp_register_script( 'bootstrap5', $bootstrap_js, [], false, true );
		\wp_register_script( static::$name, $converter_js, [ 'bootstrap5' ], false, true );

		\add_action( 'wp_enqueue_scripts', function () use ( $bootstrap_css, $bootstrap_js, $converter_js, $l10n ): void {

			\add_filter( 'script_loader_tag', function ( $tag, $handle, $source ) {
				if ( $handle === static::$name ) {
					$tag = sprintf( '<script type="module" src="%s"></script>', $source );
				}

				return $tag;
			}, 10, 3 );

			\wp_enqueue_style( 'bootstrap5', $bootstrap_css, [], false );
			\wp_enqueue_script( 'bootstrap5', $bootstrap_js, [], false, true );
			\wp_enqueue_script( static::$name, $converter_js, [ 'bootstrap5' ], false, true );

			\wp_localize_script( static::$name, static::$name, $l10n );
		} );
	}

	public function view( string $name, array $data = [] ): string {
		ob_start();

		$$name = (object) ( $data + [ 'id' => static::$name ] );
		include \plugin_dir_path( $this->_file ) . "views/{$name}.php";

		return ob_get_clean();
	}

	public function ajax(): void {
		\check_ajax_referer( static::$name );

		$method = strtolower( $_SERVER['REQUEST_METHOD'] );
		$input  = $this->getInput( $method );

		$response = null;

		if ( null !== $input && isset( $input['method'] ) ) {

			$method = sprintf( "%s_%s", $method, $input['method'] );

			if ( method_exists( $this, $method ) ) {

				$response = $this->$method();

				if ( is_object( $response ) ) {
					$response->pairs = \get_option( static::getKey( 'post_pair' ), [] );
				}
			}
		}
		\wp_send_json( $response );
	}

	public function get_prices(): ?object {
		$key      = static::getKey( __FUNCTION__ );
		$response = \get_transient( $key );

		if ( false === $response && method_exists( $this->_api, __FUNCTION__ ) ) {

			$response = $this->_api->{__FUNCTION__}();
			\set_transient( $key, $response, 5 * MINUTE_IN_SECONDS );
		}

		return $response;
	}

	public function post_pair(): bool {
		$pair = $_POST['pair'];

		$pairs = \get_option( static::getKey( __FUNCTION__ ), [] );

		if ( count( $pairs ) > 10 ) {
			array_shift( $pairs );
		}

		$pair            = json_decode( base64_decode( $pair ), 0, 512, JSON_THROW_ON_ERROR );
		$pair->timestamp = time();
		$pairs[]         = $pair;

		return \update_option( static::getKey( __FUNCTION__ ), $pairs );
	}

	public function getInput( string $method ): ?array {
		switch ( $method ) {
			case 'get':
				return $_GET;
			case 'post':
				return $_POST;
			default:
				return null;
		}
	}

	public static function getKey( string $method ): string {
		return sprintf( "%s_%s", static::$name, strtolower( $method ) );
	}

	public function install(): void {

	}

	public static function uninstall(): void {
		\delete_transient( static::getKey( 'prices' ) );
	}

	public function activate(): void {

	}

	public function deactivate(): void {

	}
}