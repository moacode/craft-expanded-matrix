<?php

namespace thejoshsmith\craftexpandedmatrix\web\assets;

use Craft;
use craft\web\AssetBundle;
use craft\web\assets\cp\CpAsset;

/**
 * Expanded Matrix AssetBundle
 * @author    Josh Smith
 * @package   ExpandedMatrix
 * @since     1.0.0
 */
class ExpandedMatrixAsset extends AssetBundle
{
    // Public Methods
    // =========================================================================

    public function init()
    {
        $this->sourcePath = "@vendor/thejoshsmith/craft-expanded-matrix/src/web/assets/dist";

        $this->depends = [
            CpAsset::class,
        ];

        $this->js = [
            'js/animatedModal.min.js',
            'js/touchswipe.min.js',
            'js/expandedMatrix.js',
        ];

        $this->css = [
            'css/animate.min.css',
            'css/lightslider.min.css',
            'css/expandedMatrix.css',
        ];

        parent::init();
    }
}
