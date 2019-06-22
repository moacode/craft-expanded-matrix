/**
 * Expanded Matrix plugin for Craft CMS
 *
 * Expanded Matrix JS
 *
 * @author    Josh Smith
 * @copyright Copyright (c) 2019 Josh Smith
 * @link      https://www.joshsmith.dev
 * @package   Expanded Matrix
 * @since     1.0.2
 */
;(function($){

    Craft.ExpandedMatrix = Garnish.Base.extend({

        $el: $(),
        expandedMatrixModal: null,

        init : function(settings){

            this.settings = $.extend({}, Craft.ExpandedMatrix.defaults, settings);
            this.$el = this.settings.$el;
            this.expandedMatrixModal = new Craft.ExpandedMatrixModal();

            var self = this,
                modalId = this.expandedMatrixModal.getModalId(),
                modalOptions = this.expandedMatrixModal.getOptions();

            // Add a new menu icon to the matrix blocks holder
            var $expandBlockLinks = this.addMatrixExpandBlocksLink(this.$el.find('.blocks'), modalId);

            // Initiate the animated modal plugin
            if( $expandBlockLinks.length > 0 ) {
                $expandBlockLinks.animatedModal(modalOptions);
                this.attachExpandBlockClickHandler($expandBlockLinks);
            }

            // Attach an event handler to initiate click handlers on new matrix blocks added
            this.$el.data('matrix').on('blockAdded', function(data) {
                var $expandBlockLink = self.addMatrixExpandBlockLink(data.$block, modalId);
                $expandBlockLink.animatedModal(modalOptions);
                self.attachExpandBlockClickHandler($expandBlockLink);
            });
        },

        // Add an event listener to open a matrix block modal
        attachExpandBlockClickHandler: function($blockLink){
            this.addListener($blockLink, 'click', function(ev) {
                ev.preventDefault();

                var $block = $(ev.target).parents('.matrixblock').eq(0),
                    $superBlocksContainer = $(ev.target).parents('.matrixLayoutContainer').eq(0),
                    $standardBlocksContainer = $(ev.target).parents('.blocks').eq(0),
                    $blocksContainer = $superBlocksContainer.length ? $superBlocksContainer : $standardBlocksContainer;
                    $blocks = $blocksContainer.children();

                $blocksContainer.addClass('js--expandedmatrix-active');

                this.initBlockModal($blocks, $block.index());
            });
        },

        addMatrixExpandBlocksLink: function($blocks, modalId){
            var self = this;
                links = [];

            $blocks.each(function(i, block){
                 links.push(self.addMatrixExpandBlockLink($(block), modalId));
            });

            return $(links).map(function(){ return this.toArray(); });
        },

        addMatrixExpandBlockLink: function($block, modalId){
            return $('<a title="Expand Matrix" href="#'+modalId+'" class="expand icon expandedmatrix-icon js--expandedmatrix-icon"/>').prependTo($block.find('.actions'));
        },

        initBlockModal: function($blocks, blockNum){
            if( !$blocks.length ) return false;

            var self = this;

            // Set blocks data on the modal
            this.expandedMatrixModal.setBlocks($blocks);

            // Display the matrix blocks!
            self.expandedMatrixModal.getEl().one(self.expandedMatrixModal.settings.animationEventEnd, function(){
                self.expandedMatrixModal.getEl().off(self.expandedMatrixModal.settings.animationEventEnd); // Required otherwise a double animation is triggered.
                self.expandedMatrixModal.displayBlocks(blockNum);
            })
        }
    });

    Craft.ExpandedMatrixModal = Garnish.Base.extend({

        $el: $(),
        $blocks: $(),
        currentBlock: null,

        init: function(settings){

            var self = this;
            this.settings = $.extend({}, Craft.ExpandedMatrixModal.defaults, settings);

            // Define the base modal markup
            this.$el = $(
                '<div id="'+this.settings.modalId+'" class="hidden">' +
                    '<a href="#" class="expandedmatrix-close close-'+this.settings.modalId+'"></a>'+
                    '<a href="#" class="expandedmatrix-nav-icon expandedmatrix-nav-icon--left js--expandedmatrix-left icon"></a>'+
                    '<a href="#" class="expandedmatrix-nav-icon expandedmatrix-nav-icon--right js--expandedmatrix-right icon"></a>'+
                    '<div class="modal-content expandedmatrix-modal-content"><div class="js--expandedmatrix-content expandedmatrix-modal-blocks"/></div>' +
                '</div>'
            ).appendTo('body');

            // Attach an event handler to close the modal on esc key
            $(document).on('keyup', function(ev){
                $(document).trigger('keyup.expandedmatrix', ev);
            });

            // On modal close
            self.$el.find('.close-'+self.getModalId()).on('click', function(e){
                self.destroy();
            });

            // Hook into the save event, and re-attach the matrix blocks.
            Craft.cp.on('beforeSaveShortcut', $.proxy(function() {
                if( !self.isModalOpen() ) return;
                Craft.cp.displayNotice('Saving Matrix Blocks...');
                self.destroy();
            }));
        },

        getEl: function(){
            return this.$el;
        },

        getModalId: function(){
            return this.settings.modalId;
        },

        getOptions: function(){
            return this.settings.options;
        },

        isModalOpen: function(){
            return this.$el.hasClass(this.getModalId()+'-on');
        },

        setBlocks: function($blocks){
            return this.$blocks = $blocks;
        },

        getBlock: function(blockNum){
            return this.$blocks[blockNum];
        },

        getCurrentBlock: function(){
            return $(this.$blocks[this.currentBlock]);
        },

        setCurrentBlock: function(blockNum){
            return this.currentBlock = blockNum;
        },

        displayBlocks: function(blockNum){
            blockNum = blockNum || 0;

            // Hide the expand icons
            this.hideBlocksExpandIcons();
            this.setCurrentBlock(blockNum);

            // Prevent the detachment from triggering an unsaved changed alert
            Craft.cp.initConfirmUnloadForms();

            this.displayBlock(blockNum, this.settings.animations.fadeIn);
            this.attachEventHandlers();
        },

        hideBlocksExpandIcons: function(){
            this.$blocks.find('.js--expandedmatrix-icon').hide();
            this.$blocks.find('.actions').hide();
            this.$blocks.find('.actions').siblings('.checkbox').hide();
        },

        showBlocksExpandIcons: function(){
            this.$blocks.find('.js--expandedmatrix-icon').show();
            this.$blocks.find('.actions').show();
            this.$blocks.find('.actions').siblings('.checkbox').show();
        },

        displayPreviousBlock: function(){
            var self = this;
                $currentBlock = this.getCurrentBlock();
            $currentBlock.addClass(this.settings.animations.leftOut).one(this.settings.animationEventEnd, function(){
                $currentBlock.removeClass(self.settings.animations.leftOut);
                self.displayBlock(self.getPreviousBlock(), self.settings.animations.rightIn);
            });
        },

        displayNextBlock: function(){
            var self = this;
                $currentBlock = this.getCurrentBlock();
            $currentBlock.addClass(this.settings.animations.rightOut).one(this.settings.animationEventEnd, function(){
                $currentBlock.removeClass(self.settings.animations.rightOut);
                self.displayBlock(self.getNextBlock(), self.settings.animations.leftIn);
            });
        },

        displayBlock: function(blockNum, animateClasses){

            this.clearBlocksAnimationClasses();

            var $currentBlock = this.getCurrentBlock();
            $currentBlock.detach();

            this.setCurrentBlock(blockNum);

            // Render the block
            var $block = $(this.$blocks[blockNum]);
            $block.appendTo('.js--expandedmatrix-content');

            // Set custom styling
            $block.addClass('expandedmatrix-active-block');

            // Remove animation classes when finished
            $block.addClass(animateClasses).one(this.settings.animationEventEnd, function(){
                $block.removeClass(animateClasses);
            });
        },

        attachEventHandlers: function(){

            // Left and Right arrow codes
            var self = this,
                transitionKeyCodes = [39,37];

            // Prevent focused Redactor textareas from triggering slide
            this.$el.find('.redactor-styles').off('keyup').on('keyup', function(e){
                if( transitionKeyCodes.indexOf(e.keyCode) > -1 ){
                    e.stopPropagation();
                }
            });

            // Define elements that should be excluded from the touch swipe
            var excludedElements = $.fn.swipe.defaults.excludedElements + ', button, input, select, textarea, a, div[contenteditable="true"], div.element';

            // Add touch capabilities to the block
            this.$el.swipe({
                swipeRight: function(e){
                    e.preventDefault();
                    self.displayPreviousBlock();
                },
                excludedElements: excludedElements
            }).swipe({
                swipeLeft: function(e){
                    e.preventDefault();
                    self.displayNextBlock();
                },
                excludedElements: excludedElements
            });

            $('.js--expandedmatrix-left').off('click').on('click', function(e){
                e.preventDefault();
                self.displayPreviousBlock();
            });

            $('.js--expandedmatrix-right').off('click').on('click', function(e){
                e.preventDefault();
                self.displayNextBlock();
            });

            // On left/right arrow keypress
            $(document).off('keyup.expandedmatrix').on('keyup.expandedmatrix', function(e){

                // Close the modal when esc is pressed
                if(e.keyCode == 27) {
                    self.$el.find('.close-'+self.getModalId()).trigger('click');
                }

                // Ensure the user isn't focused on an input
                var $activeInput = $(this).find('input:focus, textarea:focus');
                if( transitionKeyCodes.indexOf(e.keyCode) > -1 && !$activeInput.length ){

                    switch(e.keyCode){
                        case 37: // Left key
                            self.displayPreviousBlock();
                            break;
                        case 39: // Right key
                            self.displayNextBlock();
                            break;
                    }
                }
            });
        },

        clearBlocksAnimationClasses: function(){
            var self = this;
            $.each(self.settings.animations, function(k,animClass){
                self.$blocks.removeClass(animClass);
            });
        },

        destroy: function(){

            var self = this,
                $blocksContainer = $('.js--expandedmatrix-active');

            // Remove trailing animation classes
            this.clearBlocksAnimationClasses();

            this.showBlocksExpandIcons();
            this.$blocks.removeClass('expandedmatrix-active-block');
            this.$blocks.detach();

            $blocksContainer.append(this.$blocks);
            $blocksContainer.removeClass('js--expandedmatrix-active');

            // Set the scroll position to the last viewed matrix block
            var $currentDomBlock = $('[data-id="'+this.getCurrentBlock().data('id')+'"]');
            if( $currentDomBlock.length ){
                var blockOffset = $currentDomBlock.offset().top;
                $('#content').scrollTop(blockOffset - $('#content').offset().top);
            }

            this.$blocks = $();
            this.setCurrentBlock(null);

            // Remove event handler
            $(document).off('keyup.expandedmatrix');
        },

        getPreviousBlock: function(){
            var numBlocks = this.$blocks.length - 1;
            var prevBlock = this.currentBlock - 1;
            return prevBlock < 0 ? numBlocks : prevBlock;
        },

        getNextBlock: function(){
            var numBlocks = this.$blocks.length - 1;
            var nextBlock = this.currentBlock + 1;
            return nextBlock > numBlocks ? 0 : nextBlock;
        }
    }, {
        defaults: {
            modalId: 'expandedMatrixModal',
            options: {
                color: '#333f4d',
                zIndexIn: '100',
                animationDuration: '.3s',
                beforeOpen: function(){
                    var $modal = $('#'+this.modalTarget);
                    $modal.removeClass('hidden');
                }
            },
            animations: {
                leftIn: 'animated fadeInRight speed-300ms',
                leftOut: 'animated fadeOutRight speed-300ms',
                rightIn: 'animated fadeInLeft speed-300ms',
                rightOut: 'animated fadeOutLeft speed-300ms',
                fadeIn: 'animated fadeIn',
            },
            animationEventEnd: 'animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd'
        }
    });

    // Initialise the expanded matrix after the matrix input has initialised
    var CraftMatrixInputInit = Craft.MatrixInput.prototype.init;
    Craft.MatrixInput.prototype.init = function(id, blockTypes, inputNamePrefix, maxBlocks){
        CraftMatrixInputInit.apply(this, arguments);
        new Craft.ExpandedMatrix({$el: this.$container});
    };

})(jQuery);

