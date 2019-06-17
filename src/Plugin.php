<?php
/**
 * Expanded Matrix plugin for Craft CMS 3.x
 * Curate your matrix content at full screen.
 *
 * @link      https://www.joshsmith.dev
 * @copyright Copyright (c) 2019 Josh Smith <me@joshsmith.dev>
 */

namespace thejoshsmith\craftexpandedmatrix;


use Craft;
use craft\base\Plugin as CraftPlugin;
use craft\services\Plugins;
use craft\events\PluginEvent;

use yii\base\Event;

/**
 * Class Plugin
 *
 * @author    Josh Smith <me@joshsmith.dev>
 * @package   ExpandedMatrix
 * @since     1.0.0
 *
 */
class Plugin extends CraftPlugin
{
    // Static Properties
    // =========================================================================

    /**
     * @var ExpandedMatrix
     */
    public static $plugin;

    // Public Properties
    // =========================================================================

    /**
     * @var string
     */
    public $schemaVersion = '1.0.0';

    // Public Methods
    // =========================================================================

    /**
     * @inheritdoc
     */
    public function init()
    {
        parent::init();
        self::$plugin = $this;

        Event::on(
            Plugins::class,
            Plugins::EVENT_AFTER_INSTALL_PLUGIN,
            function (PluginEvent $event) {
                if ($event->plugin === $this) {
                }
            }
        );

        Craft::info(
            Craft::t(
                'expanded-matrix',
                '{name} plugin loaded',
                ['name' => $this->name]
            ),
            __METHOD__
        );
    }

    // Protected Methods
    // =========================================================================

}
