/**
 * Expanded Matrix plugin for Craft CMS
 *
 * Expanded Matrix JS
 *
 * @author    Josh Smith
 * @copyright Copyright (c) 2019 Josh Smith
 * @link      https://www.joshsmith.dev
 * @package   Expanded Matrix
 * @since     1.0.0
 */
;(function($){

    Craft.ExpandedMatrix = Garnish.Base.extend({

        $el: $(),
        expandedMatrixModal: null,

        init : function(settings){

            this.settings = $.extend({}, Craft.ExpandedMatrix.defaults, settings);
            this.$el = this.settings.$el;
            this.expandedMatrixModal = new Craft.ExpandedMatrixModal();

            var modalId = this.expandedMatrixModal.getModalId(),
                modalOptions = this.expandedMatrixModal.getOptions();

            // Add a new menu icon to the matrix blocks holder
            var $expandBlockLinks = this.addMatrixExpandBlockLinks(modalId),
                $expandBtn = this.addMatrixExpandBtn();

            // Initiate the animated modal plugin
            $expandBlockLinks.animatedModal(modalOptions);

            // Add an event listener to open a matrix block modal
            this.addListener($expandBlockLinks, 'click', function(ev) {

                var $block = $(ev.target).parents('.matrixblock').eq(0),
                    $superBlocksContainer = $(ev.target).parents('.matrixLayoutContainer').eq(0),
                    $standardBlocksContainer = $(ev.target).parents('.blocks').eq(0),
                    $blocksContainer = $superBlocksContainer.length ? $superBlocksContainer : $standardBlocksContainer;
                    $blocks = $blocksContainer.children();

                $blocksContainer.addClass('js--expandedmatrix-active');

                this.initBlockModal($blocks, $block.index());
            });
        },

        addMatrixExpandBlockLinks: function(modalId){
            return $('<a title="Expand Matrix" href="#'+modalId+'" class="expand icon expandedmatrix-icon js--expandedmatrix-icon"/>').prependTo(this.$el.find('.actions'));
        },

        addMatrixExpandBtn: function(){
            this.$el.find('.input.ltr').eq(0).addClass('clear');
            return $('<div class="btn right expandedmatrix-manage-btn" data-icon="view">Manage Blocks</div>').appendTo(this.$el.find('.heading').eq(0));
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
                '<div id="'+this.settings.modalId+'">' +
                    '<div class="close-'+this.settings.modalId+'">CLOSE MODAL</div>'+
                    '<div class="modal-content expandedmatrix-modal-content"><div class="js--expandedmatrix-content expandedmatrix-modal-blocks"/></div>' +
                '</div>'
            ).appendTo('body');

            // Attach an event handler to close the modal on esc key
            $(document).on('keyup', function(ev){
                if(ev.keyCode == 27) {
                    self.$el.find('.close-'+self.getModalId()).trigger('click');
                }
            });

            // On modal close
            self.$el.find('.close-'+self.getModalId()).on('click', function(e){
                self.destroy();
            });
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

            this.$blocks.detach();
            this.setCurrentBlock(blockNum);

            // Prevent the detachment from triggering an unsaved changed alert
            Craft.cp.initConfirmUnloadForms();

            this.displayBlock(blockNum, this.settings.animations.fadeIn);
            this.attachEventHandlers();
        },
        hideBlocksExpandIcons: function(){
            return this.$blocks.find('.js--expandedmatrix-icon').hide();
        },
        showBlocksExpandIcons: function(){
            return this.$blocks.find('.js--expandedmatrix-icon').show();
        },
        displayBlock: function(blockNum, animateClasses){

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
            this.$el.find('.redactor-styles').on('keyup', function(e){
                if( transitionKeyCodes.indexOf(e.keyCode) > -1 ){
                    e.stopPropagation();
                }
            });

            // On left/right arrow keypress
            $(document).on('keyup', function(e){

                var $activeInput = $(this).find('input:focus, textarea:focus');
                if( transitionKeyCodes.indexOf(e.keyCode) > -1 && !$activeInput.length ){

                    var blockNum = e.keyCode === 37 ? self.getPreviousBlock() : self.getNextBlock(),
                        $currentBlock = self.getCurrentBlock();

                    switch(e.keyCode){
                        case 37:
                            $currentBlock.addClass(self.settings.animations.leftOut).one(self.settings.animationEventEnd, function(){
                                $currentBlock.removeClass(self.settings.animations.leftOut);
                                self.displayBlock(blockNum, self.settings.animations.rightIn);
                            });
                            break;
                        case 39:
                            $currentBlock.addClass(self.settings.animations.rightOut).one(self.settings.animationEventEnd, function(){
                                $currentBlock.removeClass(self.settings.animations.rightOut);
                                self.displayBlock(blockNum, self.settings.animations.leftIn);
                            });
                            break;
                    }
                }

            });
        },
        destroy: function(){
            var $blocksContainer = $('.js--expandedmatrix-active');
            this.showBlocksExpandIcons();
            this.$blocks.removeClass('expandedmatrix-active-block');
            $blocksContainer.append(this.$blocks);
            $blocksContainer.removeClass('js--expandedmatrix-active');
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
        },
    }, {
        defaults: {
            modalId: 'expandedMatrixModal',
            options: {
                color: '#333f4d',
                zIndexIn: '100',
                animationDuration: '.4s'
            },
            animations: {
                leftIn: 'animated fadeInRight faster',
                leftOut: 'animated fadeOutRight faster',
                rightIn: 'animated fadeInLeft faster',
                rightOut: 'animated fadeOutLeft faster',
                fadeIn: 'animated fadeIn',
            },
            animationEventEnd: 'animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd'
        }
    });

    var $matrixFields = $('[data-type="craft\\\\fields\\\\Matrix"]');
    $matrixFields.each(function(i, matrixField){
        new Craft.ExpandedMatrix({$el: $(matrixField)});
    });

})(jQuery);
