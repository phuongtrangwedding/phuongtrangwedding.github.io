/* ============================================================================
WEDDING WEBSITE - MAIN SCRIPT (jQuery)
============================================================================ */
$.easing.easeInOutCubic = function (x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

$(function () {
    $('#navToggle').on('click', function () {
        var expanded = $(this).hasClass('open');
        $(this).toggleClass('open');
        $('#navLinks').toggleClass('open');
        $(this).attr('aria-expanded', String(!expanded));
    });

    /* --------------------------------------------------------------------------
        NAV: SOLID BACKGROUND ON SCROLL + ACTIVE LINK HIGHLIGHT
    -------------------------------------------------------------------------- */
    var $sections = $('section[id]');
    var $navLinks = $('.nav-link');

    function onScroll() {
        var scrollTop = $(window).scrollTop();

        // Nav background
        $('#siteNav').toggleClass('scrolled', scrollTop > 60);

        // Active link
        var current = '';

        $sections.each(function () {
            var top = $(this).offset().top - 120;
            if (scrollTop >= top) current = $(this).attr('id');
        });

        if (current) {
            $navLinks.removeClass('active');
            $navLinks.filter('[href="#' + current + '"]').addClass('active');
        }

        // Reveal-on-scroll elements
        revealOnScroll();

        // Hero parallax
        var heroOffset = scrollTop * 0.35;
        $('.hero-bg').css('transform', 'translateY(' + heroOffset + 'px)');
    }

    $(window).on('scroll', onScroll);
    onScroll();

    /* --------------------------------------------------------------------------
        SCROLL REVEAL ANIMATIONS
    -------------------------------------------------------------------------- */
    function revealOnScroll() {
        var windowBottom = $(window).scrollTop() + $(window).height();
        $('.reveal-on-scroll:not(.in-view)').each(function () {
            var elemTop = $(this).offset().top;
            if (elemTop < windowBottom - 100) {
                $(this).addClass('in-view');
            }
        });
    }

    /* --------------------------------------------------------------------------
        COUNTDOWN TIMER
    -------------------------------------------------------------------------- */
    (function initCountdown() {
        var $countdown = $('#countdown-timer');
        var weddingDate = new Date($countdown.data('wedding-date')).getTime();

        function tick() {
            var now = new Date().getTime();
            var distance = weddingDate - now;

            if (distance < 0) {
                $('#cd-days, #cd-hours, #cd-minutes, #cd-seconds').text('00');
                clearInterval(timer);
                return;
            }

            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);

            $('#cd-days').text(String(days).padStart(2, '0'));
            $('#cd-hours').text(String(hours).padStart(2, '0'));
            $('#cd-minutes').text(String(minutes).padStart(2, '0'));
            $('#cd-seconds').text(String(seconds).padStart(2, '0'));
        }

        tick();

        var timer = setInterval(tick, 1000);
    })();

    /* --------------------------------------------------------------------------
        GALLERY LIGHTBOX
    -------------------------------------------------------------------------- */
    (function initLightbox() {
        var images = $('.gallery-item img').map(function () {
            return $(this).attr('src');
        }).get();

        var currentIndex = 0;
        var $lightbox = $('#lightbox');
        var $lightboxImage = $('#lightboxImage');

        function openLightbox(index) {
            currentIndex = index;
            $lightboxImage.attr('src', images[currentIndex]);
            $lightbox.addClass('open');
            $('body').css('overflow', 'hidden');
        }

        function closeLightbox() {
            $lightbox.removeClass('open');
            $('body').css('overflow', '');
        }

        function showRelative(delta) {
            currentIndex = (currentIndex + delta + images.length) % images.length;
            $lightboxImage.attr('src', images[currentIndex]);
        }

        $('.gallery-item').on('click', function () {
            openLightbox($('.gallery-item').index(this));
        });

        $('#lightboxClose').on('click', closeLightbox);

        $('#lightboxPrev').on('click', function () {
            showRelative(-1);
        });

        $('#lightboxNext').on('click', function () {
            showRelative(1);
        });

        $lightbox.on('click', function (e) {
            if (e.target === this) closeLightbox();
        });

        $(document).on('keydown', function (e) {
            if (!$lightbox.hasClass('open')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') showRelative(-1);
            if (e.key === 'ArrowRight') showRelative(1);
        });
    })();

    /* ----------------------------------------------------------
       WISHES SECTION - Firestore-backed (works identically on GitHub Pages
       and locally, since it's just client-side JS talking to Firestore -
       see js/firebase-config.js for the project config, and firestore.rules
       for the write validation rules).

    var wishesCollection = db.collection('wishes'); -------------------------- */

    function escapeHtml(str) {
        return $('<div>').text(str).html();
    }

    function formatTime(date) {
        if (!date || isNaN(date.getTime())) return '';
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function renderWishes(wishes, noteMessage) {
        var $list = $('#wishesList');
        $list.empty();

        if (noteMessage) {
            $list.append('<li class="wish-note">' + noteMessage + '</li>');
        }

        if (!wishes || wishes.length === 0) {
            $list.append('<li class="wish-empty">Be the first to leave a wish for the couple!</li>');
            return;
        }

        wishes.forEach(function (wish) {
            var timeLabel = formatTime(wish.createdAt);
            var $item = $(
                '<li class="wish-item">' +
                '<span class="wish-name">' + escapeHtml(wish.name) + '</span>' +
                (timeLabel ? '<span class="wish-time">' + timeLabel + '</span>' : '') +
                '<p class="wish-content">' + escapeHtml(wish.content) + '</p>' +
                '</li>'
            );
            $list.append($item);
        });
    }

    // Real-time listener: renders instantly on page load, and any guest's new
    // wish appears live for everyone else with the page open (no refresh
    // needed). includeMetadataChanges + the 'estimate' timestamp option below
    // make a just-submitted wish appear immediately, before the server ack.
    wishesCollection.orderBy('createdAt', 'desc').onSnapshot({
        includeMetadataChanges: true
    }, function (snapshot) {
        var wishes = snapshot.docs.map(function (doc) {
            var data = doc.data({
                serverTimestamps: 'estimate'
            });
            return {
                name: data.name,
                content: data.content,
                createdAt: data.createdAt ? data.createdAt.toDate() : null
            };
        });
        renderWishes(wishes);
    }, function (err) {
        console.error('Wishes listener failed:', err);
        renderWishes([], 'Unable to load shared wishes right now. Please refresh the page.');
    });

    function setFieldError(fieldId, message) {
        var $field = $('#' + fieldId);
        var $row = $field.closest('.form-row');
        var $error = $('#' + fieldId + 'Error');
        if (message) {
            $row.addClass('has-error');
            $error.text(message);
        } else {
            $row.removeClass('has-error');
            $error.text('');
        }
    }

    function validateForm(name, content) {
        var valid = true;

        if (!name.trim()) {
            setFieldError('wishName', 'Please enter your name.');
            valid = false;
        } else {
            setFieldError('wishName', '');
        }

        if (!content.trim()) {
            setFieldError('wishContent', 'Please write a short message.');
            valid = false;
        } else {
            setFieldError('wishContent', '');
        }

        return valid;
    }

    $('#wishForm').on('submit', function (e) {
        e.preventDefault();

        var $form = $(this);
        var $status = $('#wishFormStatus');
        var $submitBtn = $('#wishSubmitBtn');
        var name = $('#wishName').val() || '';
        var content = $('#wishContent').val() || '';

        $status.text('').removeClass('success error');

        if (!validateForm(name, content)) {
            $status.addClass('error').text('Please fill in all required fields.');
            return;
        }

        $submitBtn.prop('disabled', true);

        wishesCollection.add({
            name: name.trim(),
            content: content.trim(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () {
            $status.addClass('success').text('Thank you! Your wish has been shared.');
            $form.trigger('reset');
        }).catch(function (err) {
            console.error('Wishes add failed:', err);
            $status.addClass('error').text('Unable to save your wish right now. Please try again.');
        }).finally(function () {
            $submitBtn.prop('disabled', false);
        });
    });

    /* ----------------------------------------------------------
       FOOTER YEAR
       ---------------------------------------------------------- */
    $('#footerYear').text(new Date().getFullYear());
});